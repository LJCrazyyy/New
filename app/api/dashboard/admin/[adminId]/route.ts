import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import {
  User,
  Course,
  Enrollment,
  AuditLog,
  SystemSetting,
  StudentProfile,
  FacultyProfile,
  AdminProfile,
} from '@/lib/system-models'
import { isValidObjectId, normalizeError, serializeRecord } from '@/lib/api-resources'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    adminId: string
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

export async function GET(_request: NextRequest, context: RouteContext) {
  const { adminId } = await context.params

  if (!adminId || !isValidObjectId(adminId)) {
    return apiError('Invalid admin id.', 400)
  }

  try {
    await connectToDatabase()

    const adminUser = await User.findOne({ _id: adminId, role: 'admin' })

    if (!adminUser) {
      return apiError('Admin account not found.', 404)
    }

    const [adminProfile, systemStats, recentActivity, systemSettings] = await Promise.all([
      AdminProfile.findOne({ user: adminUser._id }).populate([
        { path: 'user', select: 'systemId name email role status' },
      ]),
      // Get system statistics
      Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'faculty' }),
        User.countDocuments({ role: 'admin' }),
        Course.countDocuments({}),
        Enrollment.countDocuments({ status: 'enrolled' }),
        Enrollment.countDocuments({}),
      ]).then(([students, faculty, admins, courses, activeEnrollments, totalEnrollments]) => ({
        students,
        faculty,
        admins,
        courses,
        activeEnrollments,
        totalEnrollments,
      })),
      // Get recent activity (audit logs)
      AuditLog.find()
        .sort({ occurredAt: -1 })
        .limit(20)
        .populate([
          { path: 'actor', select: 'systemId name email role status' },
        ]),
      // Get system settings
      SystemSetting.find().sort({ key: 1 }),
    ])

    // Calculate average GPA
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

    return apiSuccess({
      admin: serializeRecord(adminUser),
      profile: adminProfile ? serializeRecord(adminProfile) : null,
      systemStats: {
        ...systemStats,
        averageGpa: Number(averageGpa.toFixed ? averageGpa.toFixed(2) : averageGpa),
      },
      recentActivity: serializeRecord(recentActivity),
      systemSettings: serializeRecord(systemSettings),
    })
  } catch (error) {
    return handleServerError(error, 500)
  }
}