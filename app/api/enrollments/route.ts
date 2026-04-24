import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { Enrollment, Course, CoursePrerequisite, SystemSetting } from '@/lib/system-models'
import { normalizeError, serializeRecord, applyPopulate, buildPagination, buildQueryFilter, buildSortClause } from '@/lib/api-resources'

export const runtime = 'nodejs'

const MAX_UNITS_PER_SEMESTER = 21

function normalizeLetterGrade(value: string | null | undefined) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\+|\-/g, '')
}

function isPassingByMinGrade(actualGrade: string | null | undefined, requiredMinGrade: string | null | undefined) {
  const order = ['A', 'B', 'C', 'D', 'F']
  const normalizedActual = normalizeLetterGrade(actualGrade)
  const normalizedRequired = normalizeLetterGrade(requiredMinGrade || 'D')

  const actualIndex = order.indexOf(normalizedActual)
  const requiredIndex = order.indexOf(normalizedRequired)

  if (actualIndex === -1 || requiredIndex === -1) {
    return false
  }

  return actualIndex <= requiredIndex
}

function apiError(message: string, status: number, details?: Record<string, unknown>) {
  return Response.json(
    {
      success: false,
      message,
      ...(details ? { details } : {}),
    },
    { status }
  )
}

function apiSuccess(data: unknown, status = 200, meta?: Record<string, unknown>) {
  return Response.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  )
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const filter = buildQueryFilter('enrollments', request.nextUrl.searchParams)
    const sort = buildSortClause('enrollments', request.nextUrl.searchParams)
    const { limit, page, skip } = buildPagination(request.nextUrl.searchParams)

    const [total, records] = await Promise.all([
      Enrollment.countDocuments(filter),
      Enrollment.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate([
          { path: 'student', select: 'systemId name email role status' },
          {
            path: 'course',
            select: 'code name section semester schedule room units enrolledCount capacity faculty',
            populate: { path: 'faculty', select: 'systemId name email role status' },
          },
        ]),
    ])

    return apiSuccess(serializeRecord(records), 200, {
      pagination: {
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    return apiError(normalizeError(error), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()

    if (!body.student || !body.course || !body.semester) {
      return apiError('Student ID, Course ID, and semester are required.', 400)
    }

    // Get the target course
    const course = await Course.findById(body.course).select('units code name')
    if (!course) {
      return apiError('Course not found.', 404)
    }

    // Enforce prerequisite rules before enrollment
    const prerequisites = await CoursePrerequisite.find({ course: body.course }).populate('prerequisiteCourse', 'code name')

    if (prerequisites.length > 0) {
      const completedEnrollments = await Enrollment.find({
        student: body.student,
        status: 'completed',
        average: { $ne: null },
      }).populate('course', 'code name')

      const completedByCourseId = new Map(
        completedEnrollments.map((enrollment) => [String(enrollment.course?._id ?? enrollment.course), enrollment])
      )

      const missingPrerequisites = prerequisites
        .map((prerequisite) => {
          const prerequisiteCourseId = String(prerequisite.prerequisiteCourse?._id ?? prerequisite.prerequisiteCourse)
          const completedEnrollment = completedByCourseId.get(prerequisiteCourseId)

          if (!completedEnrollment) {
            return {
              code: (prerequisite.prerequisiteCourse as any)?.code,
              name: (prerequisite.prerequisiteCourse as any)?.name,
              minGrade: prerequisite.minGrade,
              reason: 'not-completed',
            }
          }

          if (!isPassingByMinGrade(completedEnrollment.gradeLetter, prerequisite.minGrade)) {
            return {
              code: (prerequisite.prerequisiteCourse as any)?.code,
              name: (prerequisite.prerequisiteCourse as any)?.name,
              minGrade: prerequisite.minGrade,
              actualGrade: completedEnrollment.gradeLetter,
              reason: 'min-grade-not-met',
            }
          }

          return null
        })
        .filter(Boolean)

      if (missingPrerequisites.length > 0) {
        return apiError('Enrollment blocked: prerequisite requirements are not satisfied.', 400, {
          courseCode: course.code,
          prerequisites: missingPrerequisites,
        })
      }
    }

    // Get max units setting from database, fallback to constant
    let maxUnits = MAX_UNITS_PER_SEMESTER
    try {
      const setting = await SystemSetting.findOne({ key: 'maxUnitsPerSemester' }).select('value')
      if (setting && typeof setting.value === 'number') {
        maxUnits = setting.value
      }
    } catch {
      // Use default if setting lookup fails
    }

    // Check current enrolled units for this student in this semester
    const currentEnrollments = await Enrollment.find({
      student: body.student,
      semester: body.semester,
      status: { $in: ['enrolled', 'pending'] }, // Don't count dropped or completed
    }).populate('course', 'units')

    const currentUnits = currentEnrollments.reduce((sum, enrollment) => {
      const enrollmentUnits = enrollment.course?.units ?? 0
      return sum + enrollmentUnits
    }, 0)

    const totalUnitsAfterEnrollment = currentUnits + (course.units ?? 0)

    if (totalUnitsAfterEnrollment > maxUnits) {
      return apiError(
        `Cannot enroll: student already has ${currentUnits} units enrolled. Adding this ${course.units || 0}-unit course would exceed the maximum of ${maxUnits} units per semester.`,
        400,
        {
          currentUnits,
          courseUnits: course.units,
          maxUnits,
          totalWouldBe: totalUnitsAfterEnrollment,
        }
      )
    }

    // Check for duplicate enrollment
    const existingEnrollment = await Enrollment.findOne({
      student: body.student,
      course: body.course,
      semester: body.semester,
    })

    if (existingEnrollment) {
      return apiError('Student is already enrolled in this course for this semester.', 409)
    }

    // Create the enrollment
    const enrollment = await Enrollment.create({
      student: body.student,
      course: body.course,
      semester: body.semester,
      status: body.status || 'pending',
    })

    const populatedEnrollment = await Enrollment.findById(enrollment._id).populate([
      { path: 'student', select: 'systemId name email role status' },
      {
        path: 'course',
        select: 'code name section semester schedule room units enrolledCount capacity faculty',
        populate: { path: 'faculty', select: 'systemId name email role status' },
      },
    ])

    return apiSuccess(serializeRecord(populatedEnrollment), 201)
  } catch (error) {
    const message = normalizeError(error)

    if (message.includes('duplicate key') || message.includes('E11000')) {
      return apiError('Student is already enrolled in this course for this semester.', 409)
    }

    return apiError(message, 400)
  }
}
