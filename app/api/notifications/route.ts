import { NextRequest } from 'next/server'
import { getFirestoreDb } from '@/lib/firebase'
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

async function fetchNotificationsPage(params: URLSearchParams) {
  const db = getFirestoreDb()
  const recipientId = params.get('recipientId')?.trim()
  const recipientRole = params.get('recipientRole')?.trim().toLowerCase()
  const limitValue = Number(params.get('limit') ?? '20')
  const pageValue = Number(params.get('page') ?? '1')
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 50) : 20
  const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1
  const skip = (page - 1) * limit

  let baseQuery = db.collection('notifications').orderBy('createdAt', 'desc')

  if (recipientId) {
    baseQuery = baseQuery.where('recipientId', '==', recipientId)
  } else if (recipientRole) {
    baseQuery = baseQuery.where('recipientRole', '==', recipientRole)
  } else {
    baseQuery = baseQuery.where('recipientRole', 'in', ['student', 'faculty', 'admin'])
  }

  const snapshot = await baseQuery.get()
  const records = snapshot.docs.map((doc) => ({ id: doc.id, _id: doc.id, ...doc.data() }))
  const filteredRecords = recipientId
    ? records
    : records.filter((record) => record.recipientId == null || record.recipientId === '')

  const pagedRecords = filteredRecords.slice(skip, skip + limit)
  const unreadCount = filteredRecords.filter((record) => !record.isRead).length

  return {
    notifications: pagedRecords,
    total: filteredRecords.length,
    unreadCount,
    page,
    limit,
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await fetchNotificationsPage(request.nextUrl.searchParams)

    return apiSuccess(serializeRecord(result.notifications), 200, {
      unreadCount: result.unreadCount,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
    })
  } catch (error) {
    return apiError(normalizeError(error), 500)
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
    const db = getFirestoreDb()
    const now = new Date()
    const payload = {
      recipientId: typeof body.recipientId === 'string' ? body.recipientId.trim() : '',
      recipientRole,
      title,
      message,
      type: typeof body.type === 'string' ? body.type.trim().toLowerCase() : 'system',
      link: typeof body.link === 'string' ? body.link.trim() : '',
      isRead: Boolean(body.isRead),
      readAt: body.readAt ? new Date(body.readAt) : null,
      createdBy: typeof body.createdBy === 'string' ? body.createdBy : '',
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await db.collection('notifications').add(payload)
    return apiSuccess(serializeRecord({ id: docRef.id, _id: docRef.id, ...payload }), 201)
  } catch (error) {
    return apiError(normalizeError(error), 500)
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
    if (body.markAllRead !== true) {
      return apiError('No notification update requested.', 400)
    }

    const db = getFirestoreDb()
    const collection = db.collection('notifications')
    const batch = db.batch()
    const now = new Date()

    const snapshot = recipientId
      ? await collection.where('recipientId', '==', recipientId).get()
      : recipientRole
        ? await collection.where('recipientRole', '==', recipientRole).get()
        : await collection.where('recipientRole', 'in', ['student', 'faculty', 'admin']).get()

    let matchedCount = 0

    for (const doc of snapshot.docs) {
      const data = doc.data() as Record<string, unknown>
      if (recipientId || data.recipientId == null || data.recipientId === '') {
        batch.update(doc.ref, { isRead: true, readAt: now, updatedAt: now })
        matchedCount += 1
      }
    }

    if (matchedCount === 0) {
      return apiSuccess({ matchedCount: 0, modifiedCount: 0 })
    }

    await batch.commit()

    return apiSuccess({ matchedCount, modifiedCount: matchedCount })
  } catch (error) {
    return apiError(normalizeError(error), 500)
  }
}