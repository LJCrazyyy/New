import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import {
  applyPopulate,
  buildPagination,
  buildQueryFilter,
  buildSortClause,
  getResourceConfig,
  isValidObjectId,
  normalizeError,
  parseJsonBody,
  serializeRecord,
} from '@/lib/api-resources'

export const runtime = 'nodejs'

const protectedSystemSettingsKeys = new Set([
  'maintenanceMode',
  'registrationStatus',
  'currentSemester',
  'academicYear',
])

function getRequestRole(request: NextRequest) {
  return request.headers.get('x-user-role')?.trim().toLowerCase() ?? ''
}

function isProtectedSystemSettingKey(value: unknown) {
  return typeof value === 'string' && protectedSystemSettingsKeys.has(value)
}

type RouteContext = {
  params: Promise<{
    collection: string
    params?: string[]
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

async function resolveResource(context: RouteContext) {
  const { collection, params = [] } = await context.params
  const resource = getResourceConfig(collection)

  if (!resource) {
    return { error: apiError(`Unknown resource: ${collection}`, 404) }
  }

  return { collection, params, resource }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const resolved = await resolveResource(context)

  if ('error' in resolved) {
    return resolved.error
  }

  const { collection, params, resource } = resolved

  try {
    await connectToDatabase()

    if (params.length === 0) {
      const filter = buildQueryFilter(collection, request.nextUrl.searchParams)
      const sort = buildSortClause(collection, request.nextUrl.searchParams)
      const { limit, page, skip } = buildPagination(request.nextUrl.searchParams)

      const [total, records] = await Promise.all([
        resource.model.countDocuments(filter),
        resource.model.find(filter).sort(sort).skip(skip).limit(limit),
      ])

      const populatedRecords = await applyPopulate(
        resource.model,
        records,
        collection,
        request.nextUrl.searchParams.get('populate')
      )

      return apiSuccess(serializeRecord(populatedRecords), 200, {
        pagination: {
          total,
          page,
          limit,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      })
    }

    const [recordId] = params

    if (!recordId || !isValidObjectId(recordId)) {
      return apiError('Invalid record id.', 400)
    }

    const record = await resource.model.findById(recordId)

    if (!record) {
      return apiError('Record not found.', 404)
    }

    const populatedRecord = await applyPopulate(
      resource.model,
      record,
      collection,
      request.nextUrl.searchParams.get('populate')
    )

    return apiSuccess(serializeRecord(populatedRecord))
  } catch (error) {
    return apiError(normalizeError(error), 500)
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const resolved = await resolveResource(context)

  if ('error' in resolved) {
    return resolved.error
  }

  const { collection, params, resource } = resolved

  if (params.length > 0) {
    return apiError('Create requests must target the collection root.', 405)
  }

  const body = await parseJsonBody(request)

  if (!body) {
    return apiError('Request body is required.', 400)
  }

  try {
    await connectToDatabase()

    const createdRecord = Array.isArray(body)
      ? await resource.model.insertMany(body)
      : await resource.model.create(body)

    const populatedRecord = await applyPopulate(
      resource.model,
      createdRecord,
      collection,
      request.nextUrl.searchParams.get('populate')
    )

    return apiSuccess(serializeRecord(populatedRecord), 201)
  } catch (error) {
    const message = normalizeError(error)

    if (message.includes('duplicate key')) {
      return apiError('A record with the same unique field already exists.', 409)
    }

    return apiError(message, 400)
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return updateRecord(request, context)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return updateRecord(request, context)
}

async function updateRecord(request: NextRequest, context: RouteContext) {
  const resolved = await resolveResource(context)

  if ('error' in resolved) {
    return resolved.error
  }

  const { collection, params, resource } = resolved

  if (params.length === 0) {
    return apiError('Update requests must target a record id.', 405)
  }

  const [recordId] = params

  if (!recordId || !isValidObjectId(recordId)) {
    return apiError('Invalid record id.', 400)
  }

  const body = await parseJsonBody(request)

  if (!body) {
    return apiError('Request body is required.', 400)
  }

  try {
    await connectToDatabase()

    if (collection === 'system-settings') {
      const existingRecord = await resource.model.findById(recordId).select('key')

      if (!existingRecord) {
        return apiError('Record not found.', 404)
      }

      const existingKey = existingRecord?.key
      const nextKey = typeof body?.key === 'string' ? body.key : undefined
      const affectsProtectedKey = isProtectedSystemSettingKey(existingKey) || isProtectedSystemSettingKey(nextKey)

      if (affectsProtectedKey && getRequestRole(request) !== 'admin') {
        return apiError('Only admins can modify protected settings.', 403)
      }
    }

    const updatedRecord = await resource.model.findByIdAndUpdate(recordId, body, {
      new: true,
      runValidators: true,
    })

    if (!updatedRecord) {
      return apiError('Record not found.', 404)
    }

    const populatedRecord = await applyPopulate(
      resource.model,
      updatedRecord,
      collection,
      request.nextUrl.searchParams.get('populate')
    )

    return apiSuccess(serializeRecord(populatedRecord))
  } catch (error) {
    const message = normalizeError(error)

    if (message.includes('duplicate key')) {
      return apiError('A record with the same unique field already exists.', 409)
    }

    return apiError(message, 400)
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const resolved = await resolveResource(context)

  if ('error' in resolved) {
    return resolved.error
  }

  const { params, resource } = resolved

  if (params.length === 0) {
    return apiError('Delete requests must target a record id.', 405)
  }

  const [recordId] = params

  if (!recordId || !isValidObjectId(recordId)) {
    return apiError('Invalid record id.', 400)
  }

  try {
    await connectToDatabase()

    if (resolved.collection === 'system-settings') {
      const existingRecord = await resource.model.findById(recordId).select('key')

      if (!existingRecord) {
        return apiError('Record not found.', 404)
      }

      if (isProtectedSystemSettingKey(existingRecord?.key) && getRequestRole(request) !== 'admin') {
        return apiError('Only admins can delete protected settings.', 403)
      }
    }

    const deletedRecord = await resource.model.findByIdAndDelete(recordId)

    if (!deletedRecord) {
      return apiError('Record not found.', 404)
    }

    return apiSuccess(serializeRecord(deletedRecord))
  } catch (error) {
    return apiError(normalizeError(error), 500)
  }
}