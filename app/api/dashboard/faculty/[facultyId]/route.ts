import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import { Enrollment, FacultyProfile, Course, StudentProfile, User } from '@/lib/system-models'
import { isValidObjectId, normalizeError, serializeRecord } from '@/lib/api-resources'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    facultyId: string
  }>
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

function apiSuccess(data: unknown, status = 200) {
  return Response.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

function getYearValue(yearLevel?: string | null) {
  const parsedValue = Number(yearLevel?.match(/\d+/)?.[0] ?? 0)
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1
}

function calculateStatus(average: number | null) {
  if (average == null) return 'Pending'
  if (average >= 90) return 'Excellent'
  if (average >= 85) return 'Very Good'
  if (average >= 80) return 'Good'
  return 'Needs Support'
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { facultyId } = await context.params

  if (!facultyId || !isValidObjectId(facultyId)) {
    return apiError('Invalid faculty id.', 400)
  }

  try {
    await connectToDatabase()

    const facultyUser = await User.findOne({ _id: facultyId, role: 'faculty' })

    if (!facultyUser) {
      return apiError('Faculty account not found.', 404)
    }

    const [facultyProfile, assignedCourses] = await Promise.all([
      FacultyProfile.findOne({ user: facultyUser._id }).populate([
        { path: 'user', select: 'systemId name email role status' },
        { path: 'coursesAssigned', select: 'code name section semester room units faculty enrolledCount capacity' },
      ]),
      Course.find({ faculty: facultyUser._id }).sort({ code: 1 }).populate({ path: 'faculty', select: 'systemId name email role status' }),
    ])

    const courseIds = assignedCourses.map((course) => course._id)

    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .sort({ createdAt: -1 })
      .populate([
        { path: 'student', select: 'systemId name email role status' },
        {
          path: 'course',
          select: 'code name section semester schedule room units enrolledCount capacity faculty',
          populate: { path: 'faculty', select: 'systemId name email role status' },
        },
      ])

    const studentUserIds = Array.from(
      new Set(
        enrollments
          .map((enrollment) => String((enrollment.student as any)?._id ?? enrollment.student))
          .filter(Boolean)
      )
    )

    const studentProfiles = await StudentProfile.find({ user: { $in: studentUserIds } })

    const rosterSource = serializeRecord(enrollments)
    const rosterByStudent = new Map<string, any>()

    const yearLevelByStudentId = new Map(
      studentProfiles.map((profile) => [String(profile.user), profile.yearLevel ?? '1st'] as const)
    )

    for (const enrollment of rosterSource as any[]) {
      const studentId = enrollment.student?.id ?? enrollment.student?._id ?? enrollment.student?.systemId
      if (!studentId) {
        continue
      }

      if (!rosterByStudent.has(studentId)) {
        rosterByStudent.set(studentId, {
          id: studentId,
          name: enrollment.student?.name ?? 'Unknown',
          email: enrollment.student?.email ?? '',
          year: yearLevelByStudentId.get(String(studentId)) ?? '1st',
          status: enrollment.student?.status ?? 'active',
          courses: [],
          averages: [],
        })
      }

      const entry = rosterByStudent.get(studentId)
      entry.courses.push({
        code: enrollment.course?.code ?? '',
        name: enrollment.course?.name ?? '',
        semester: enrollment.semester,
      })

      if (typeof enrollment.average === 'number') {
        entry.averages.push(enrollment.average)
      }
    }

    const roster = Array.from(rosterByStudent.values()).map((student) => ({
      ...student,
      average: student.averages.length > 0
        ? Number((student.averages.reduce((sum: number, value: number) => sum + value, 0) / student.averages.length).toFixed(1))
        : null,
      statusLabel: calculateStatus(student.averages.length > 0 ? student.averages.reduce((sum: number, value: number) => sum + value, 0) / student.averages.length : null),
      year: student.year ?? '1st',
    })).sort((left, right) => String(left.name).localeCompare(String(right.name)))

    const performance = roster
      .map((student) => ({
        id: student.id,
        name: student.name,
        average: student.average ?? 0,
        status: student.statusLabel,
        year: getYearValue(student.year),
      }))
      .sort((left, right) => String(left.name).localeCompare(String(right.name)))

    const sortedEnrollments = serializeRecord(enrollments).sort((left: any, right: any) => {
      const leftName = String(left.student?.name ?? '')
      const rightName = String(right.student?.name ?? '')
      const nameComparison = leftName.localeCompare(rightName)

      if (nameComparison !== 0) {
        return nameComparison
      }

      return String(left.course?.code ?? '').localeCompare(String(right.course?.code ?? ''))
    })

    return apiSuccess({
      faculty: serializeRecord(facultyUser),
      profile: facultyProfile ? serializeRecord(facultyProfile) : null,
      assignedCourses: serializeRecord(assignedCourses),
      classRoster: roster,
      studentPerformance: performance,
      enrollments: sortedEnrollments,
      totalStudents: roster.length,
      totalCourses: assignedCourses.length,
    })
  } catch (error) {
    return apiError(normalizeError(error), 500)
  }
}