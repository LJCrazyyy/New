import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/database'
import { Notification } from '@/lib/system-models'
import { isValidObjectId, normalizeError, serializeRecord } from '@/lib/api-resources'

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

type RouteContext = {
  params: Promise<{
    notificationId: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { notificationId } = await context.params

  if (!notificationId || !isValidObjectId(notificationId)) {
    return apiError('Invalid notification id.', 400)
  }

  const body = await request.json().catch(() => null)

  if (!body || typeof body !== 'object') {
    return apiError('Notification update payload is required.', 400)
  }

  try {
    await connectToDatabase()

    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        $set: {
          isRead: body.isRead !== false,
          readAt: body.isRead === false ? null : new Date(),
        },
      },
      { new: true }
    )

    if (!updatedNotification) {
      return apiError('Notification not found.', 404)
    }

    return apiSuccess(serializeRecord(updatedNotification))
  } catch (error) {
    return handleServerError(error, 500)
  }
}