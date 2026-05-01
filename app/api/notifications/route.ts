import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import { Notification } from '@/lib/system-models'
import { normalizeError, serializeRecord } from '@/lib/api-resources'

export const runtime = 'nodejs'

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

function handleServerError(error: unknown, defaultStatus = 500) {
  const message = normalizeError(error)

  if (typeof message === 'string' && message.includes('RESOURCE_EXHAUSTED')) {
    return apiError('Service temporarily unavailable: quota exceeded. Please try again later or contact the administrator.', 503, {
      raw: message,
    })
  }

  return apiError(message, defaultStatus)
}

function buildRecipientFilter(searchParams: URLSearchParams) {
  const recipientId = searchParams.get('recipientId')?.trim()
  const recipientRole = searchParams.get('recipientRole')?.trim().toLowerCase()

  const filters: Array<Record<string, unknown>> = []

  if (recipientId) {
    filters.push({ recipientId })
  }

  if (recipientRole) {
    filters.push({ recipientRole, recipientId: { $in: [null, ''] } })
  }

  if (filters.length === 0) {
    filters.push({ recipientRole: { $in: ['student', 'faculty', 'admin'] }, recipientId: { $in: [null, ''] } })
  }

  return { $or: filters }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const filter = buildRecipientFilter(request.nextUrl.searchParams)
    const limitValue = Number(request.nextUrl.searchParams.get('limit') ?? '20')
    const pageValue = Number(request.nextUrl.searchParams.get('page') ?? '1')
    const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 50) : 20
    const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1
    const skip = (page - 1) * limit

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false }),
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ])

    return apiSuccess(serializeRecord(notifications), 200, {
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    return handleServerError(error, 500)
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== 'object') {
    return apiError('Notification payload is required.', 400)
  }

  const recipientRole = typeof body.recipientRole === 'string' ? body.recipientRole.trim().toLowerCase() : ''
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!recipientRole || !title || !message) {
    return apiError('recipientRole, title, and message are required.', 400)
  }

  try {
    await connectToDatabase()

    const notification = await Notification.create({
      recipientId: typeof body.recipientId === 'string' ? body.recipientId.trim() : '',
      recipientRole,
      title,
      message,
      type: typeof body.type === 'string' ? body.type.trim().toLowerCase() : 'system',
      link: typeof body.link === 'string' ? body.link.trim() : '',
      isRead: Boolean(body.isRead),
      readAt: body.readAt ? new Date(body.readAt) : undefined,
      createdBy: typeof body.createdBy === 'string' ? body.createdBy : undefined,
    })

    return apiSuccess(serializeRecord(notification), 201)
  } catch (error) {
    return handleServerError(error, 500)
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== 'object') {
    return apiError('Notification update payload is required.', 400)
  }

  const recipientId = typeof body.recipientId === 'string' ? body.recipientId.trim() : ''
  const recipientRole = typeof body.recipientRole === 'string' ? body.recipientRole.trim().toLowerCase() : ''

  if (!recipientId && !recipientRole) {
    return apiError('recipientId or recipientRole is required to update notifications.', 400)
  }

  try {
    await connectToDatabase()

    const filter: Record<string, unknown> = {}

    if (recipientId) {
      filter.$or = [...(filter.$or as Array<Record<string, unknown>> | undefined ?? []), { recipientId }]
    }

    if (recipientRole) {
      filter.$or = [...(filter.$or as Array<Record<string, unknown>> | undefined ?? []), { recipientRole, recipientId: { $in: [null, ''] } }]
    }

    const update: Record<string, unknown> = {}

    if (body.markAllRead === true) {
      update.$set = { isRead: true, readAt: new Date() }
    }

    if (Object.keys(update).length === 0) {
      return apiError('No notification update requested.', 400)
    }

    const result = await Notification.updateMany(filter, update)

    return apiSuccess({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount })
  } catch (error) {
    return handleServerError(error, 500)
  }
}