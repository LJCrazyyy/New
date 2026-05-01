import { connectToDatabase } from '@/lib/database'
import {
  AuditLog,
  Course,
  Enrollment,
  User,
  SystemSetting,
} from '@/lib/system-models'
import { normalizeError, serializeRecord } from '@/lib/api-resources'

export const runtime = 'nodejs'

const MAX_STUDENTS_PER_COURSE = 50

function normalizeCourseValue(value: unknown) {
  const numericValue = Number(value ?? 0)
  return Number.isFinite(numericValue) ? Math.min(Math.max(numericValue, 0), MAX_STUDENTS_PER_COURSE) : 0
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

export async function GET() {
  try {
    await connectToDatabase()

    const [studentCount, facultyCount, adminCount, courseCount, enrollmentCount, recentLogs, recentSettings, recentCourses] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
      User.countDocuments({ role: 'admin' }),
      Course.countDocuments({}),
      Enrollment.countDocuments({}),
      AuditLog.find().sort({ occurredAt: -1 }).limit(8),
      SystemSetting.find().sort({ key: 1 }).limit(10),
      Course.find().sort({ createdAt: -1 }).limit(5),
    ])

    const activeEnrollments = await Enrollment.countDocuments({ status: 'enrolled' })
    const averageGpaResult = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $lookup: {
          from: 'studentprofiles',
          localField: '_id',
          foreignField: 'user',
          as: 'profile',
        },
      },
      { $unwind: '$profile' },
      {
        $group: {
          _id: null,
          averageGpa: { $avg: '$profile.gpa' },
        },
      },
    ])

    const averageGpa = averageGpaResult[0]?.averageGpa ?? 0

    const normalizedRecentCourses = serializeRecord(recentCourses).map((course: any) => ({
      ...course,
      enrolledCount: normalizeCourseValue(course.enrolledCount),
      capacity: normalizeCourseValue(course.capacity),
    }))

    return apiSuccess({
      stats: {
        students: studentCount,
        faculty: facultyCount,
        admins: adminCount,
        courses: courseCount,
        enrollments: enrollmentCount,
        activeEnrollments,
        averageGpa: Number(averageGpa.toFixed ? averageGpa.toFixed(2) : averageGpa),
      },
      recentLogs: serializeRecord(recentLogs),
      recentSettings: serializeRecord(recentSettings),
      recentCourses: normalizedRecentCourses,
    })
  } catch (error) {
    return handleServerError(error, 500)
  }
}