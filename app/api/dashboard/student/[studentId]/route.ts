import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import {
  AcademicHistory,
  CounselingRecord,
  DisciplineRecord,
  Enrollment,
  MedicalRecord,
  StudentDocument,
  StudentOrganization,
  StudentProfile,
  SystemSetting,
  User,
} from '@/lib/system-models'
import { isValidObjectId, normalizeError, serializeRecord } from '@/lib/api-resources'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    studentId: string
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

function handleServerError(error: unknown, defaultStatus = 500) {
  const message = normalizeError(error)

  if (typeof message === 'string' && message.includes('RESOURCE_EXHAUSTED')) {
    return apiError('Service temporarily unavailable: quota exceeded. Please try again later or contact the administrator.', 503, {
      raw: message,
    })
  }

  return apiError(message, defaultStatus)
}

function getYearLevelValue(yearLevel?: string | null) {
  const parsedValue = Number(yearLevel?.match(/\d+/)?.[0] ?? 0)
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1
}

function calculateGradeRemark(average: number | null) {
  if (average == null) return 'Pending'
  if (average >= 90) return 'Excellent'
  if (average >= 85) return 'Very Good'
  if (average >= 80) return 'Good'
  return 'Needs Improvement'
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { studentId } = await context.params

  if (!studentId) {
    return apiError('Invalid student id.', 400)
  }

  try {
    await connectToDatabase()

    const normalizedStudentId = studentId.trim()
    const normalizedStudentEmail = normalizedStudentId.toLowerCase()
    const userLookup = isValidObjectId(normalizedStudentId)
      ? { _id: normalizedStudentId, role: 'student' as const }
      : {
          role: 'student' as const,
          $or: [{ systemId: normalizedStudentId }, { email: normalizedStudentEmail }],
        }

    const studentUser = await User.findOne(userLookup)

    if (!studentUser) {
      return apiError('Student account not found.', 404)
    }

    const [studentProfile, currentSemesterSetting, currentEnrollments, completedEnrollments, allEnrollments, history, medicalRecords, counselingRecords, disciplineRecords, documents, organizations] = await Promise.all([
      StudentProfile.findOne({ user: studentUser._id }),
      SystemSetting.findOne({ key: 'currentSemester' }),
      Enrollment.find({ student: studentUser._id, status: { $in: ['enrolled', 'pending'] } })
        .sort({ createdAt: -1 })
        .populate([
          { path: 'student', select: 'systemId name email role status' },
          {
            path: 'course',
            select: 'code name section semester schedule room units enrolledCount capacity faculty',
            populate: { path: 'faculty', select: 'systemId name email role status' },
          },
        ]),
      Enrollment.find({ student: studentUser._id, average: { $ne: null } })
        .sort({ createdAt: -1 })
        .populate([
          { path: 'student', select: 'systemId name email role status' },
          {
            path: 'course',
            select: 'code name section semester schedule room units enrolledCount capacity faculty',
            populate: { path: 'faculty', select: 'systemId name email role status' },
          },
        ]),
      Enrollment.find({ student: studentUser._id })
        .sort({ createdAt: -1 })
        .populate([
          { path: 'student', select: 'systemId name email role status' },
          {
            path: 'course',
            select: 'code name section semester schedule room units enrolledCount capacity faculty',
            populate: { path: 'faculty', select: 'systemId name email role status' },
          },
        ]),
      AcademicHistory.find({ student: studentUser._id })
        .sort({ recordedAt: -1 })
        .limit(10)
        .populate([
          { path: 'student', select: 'systemId name email role status' },
          { path: 'relatedCourse', select: 'code name section semester room units' },
          { path: 'createdBy', select: 'systemId name email role status' },
        ]),
      MedicalRecord.find({ student: studentUser._id }).sort({ recordedAt: -1 }).limit(10).populate({ path: 'student', select: 'systemId name email role status' }),
      CounselingRecord.find({ student: studentUser._id }).sort({ sessionDate: -1 }).limit(10).populate([
        { path: 'student', select: 'systemId name email role status' },
        { path: 'counselor', select: 'systemId name email role status' },
      ]),
      (await DisciplineRecord.find({ student: studentUser._id }).sort({ incidentDate: -1 }).limit(10).populate({ path: 'student', select: 'systemId name email role status' })) as Array<{
        status?: string
      }>,
      StudentDocument.find({ student: studentUser._id }).sort({ createdAt: -1 }).limit(10).populate({ path: 'student', select: 'systemId name email role status' }),
      StudentOrganization.find({ student: studentUser._id }).sort({ joinedAt: -1 }).limit(10).populate({ path: 'student', select: 'systemId name email role status' }),
    ])

    const currentSemester = typeof currentSemesterSetting?.value === 'string' ? currentSemesterSetting.value : null
    const profileUnitsCompleted = studentProfile?.unitsCompleted ?? 0
    const profileUnitsEnrolled = studentProfile?.unitsEnrolled ?? 0
    const serializedCurrentEnrollments = serializeRecord(currentEnrollments) as any[]
    const serializedCompletedEnrollments = serializeRecord(completedEnrollments) as any[]
    const serializedActivityEnrollments = serializeRecord(allEnrollments) as any[]

    const currentCourses = serializedCurrentEnrollments.map((enrollment) => {
      const courseRecord = enrollment.course as any

      return {
        // Use the actual course id for activity lookups on the student side.
        id: courseRecord?.id ?? '',
        enrollmentId: enrollment.id,
        code: courseRecord?.code ?? '',
        name: courseRecord?.name ?? '',
        instructor: courseRecord?.faculty?.name ?? 'TBA',
        schedule: courseRecord?.schedule ?? '',
        room: courseRecord?.room ?? '',
        units: courseRecord?.units ?? 0,
        status: enrollment.status === 'pending' ? 'Pending' : 'Active',
        semester: enrollment.semester,
      }
    })

    const activityCourses = serializedActivityEnrollments.map((enrollment) => {
      const courseRecord = enrollment.course as any

      return {
        id: courseRecord?.id ?? '',
        enrollmentId: enrollment.id,
        code: courseRecord?.code ?? '',
        name: courseRecord?.name ?? '',
        instructor: courseRecord?.faculty?.name ?? 'TBA',
        schedule: courseRecord?.schedule ?? '',
        room: courseRecord?.room ?? '',
        units: courseRecord?.units ?? 0,
        status: enrollment.status === 'pending' ? 'Pending' : enrollment.status === 'enrolled' ? 'Active' : 'Completed',
        semester: enrollment.semester,
      }
    })

    const recentGrades = serializedCompletedEnrollments.map((enrollment) => {
      return {
        id: enrollment.id,
        code: (enrollment.course as any)?.code ?? '',
        name: (enrollment.course as any)?.name ?? '',
        prelim: enrollment.prelim,
        midterm: enrollment.midterm,
        final: enrollment.final,
        average: enrollment.average,
        remarks: calculateGradeRemark(enrollment.average),
      }
    })

    const totalUnitsCompleted =
      profileUnitsCompleted || serializedCompletedEnrollments.reduce((sum, enrollment) => sum + ((enrollment.course as any)?.units ?? 0), 0)
    const totalUnitsEnrolled =
      profileUnitsEnrolled || serializedCurrentEnrollments.reduce((sum, enrollment) => sum + ((enrollment.course as any)?.units ?? 0), 0)
    const coreUnitsCompleted = Math.round(totalUnitsCompleted * 0.6)
    const electiveUnitsCompleted = Math.max(0, totalUnitsCompleted - coreUnitsCompleted)
    const cumulativeGpa = studentProfile?.gpa ?? 0
    const academicStatus = cumulativeGpa >= 3.5 ? 'Excellent' : cumulativeGpa >= 3.0 ? 'On Track' : 'Needs Support'
    const alerts = disciplineRecords.some((record) => record.status !== 'resolved')
      ? 'There are open discipline items requiring attention.'
      : 'No active alerts.'

    return apiSuccess({
      student: serializeRecord(studentUser),
      profile: studentProfile ? serializeRecord(studentProfile) : null,
      progress: {
        cumulativeGPA: cumulativeGpa,
        totalUnitsRequired: 120,
        totalUnitsCompleted,
        totalUnitsEnrolled,
        coreUnitsCompleted,
        electiveUnitsCompleted,
        status: academicStatus,
        currentYear: getYearLevelValue(studentProfile?.yearLevel),
        currentSemester: currentSemester ?? 'Current Semester',
        alerts,
      },
      currentCourses,
      recentGrades,
      activityCourses,
      academicHistory: serializeRecord(history),
      medicalRecords: serializeRecord(medicalRecords),
      counselingRecords: serializeRecord(counselingRecords),
      disciplineRecords: serializeRecord(disciplineRecords),
      documents: serializeRecord(documents),
      organizations: serializeRecord(organizations),
      currentSemester,
    })
  } catch (error) {
    return handleServerError(error, 500)
  }
}