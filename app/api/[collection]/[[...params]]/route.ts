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
import { Course, Enrollment, SystemSetting } from '@/lib/system-models'

export const runtime = 'nodejs'

const protectedSystemSettingsKeys = new Set([
  'maintenanceMode',
  'registrationStatus',
  'currentSemester',
  'academicYear',
])

const ACTIVE_ENROLLMENT_STATUSES = ['enrolled', 'pending'] as const

async function syncCourseEnrolledCount(courseId: string, semester: string) {
  const activeEnrollmentCount = await Enrollment.countDocuments({
    course: courseId,
    semester,
    status: { $in: ACTIVE_ENROLLMENT_STATUSES },
  })

  const normalizedEnrolledCount = Math.min(activeEnrollmentCount, 50)

  await Course.updateOne(
    { _id: courseId },
    {
      $set: { enrolledCount: normalizedEnrolledCount },
    }
  )
}

async function syncAllCourseConstraints() {
  await Course.updateMany(
    { capacity: { $gt: 50 } },
    {
      $set: { capacity: 50 },
    }
  )

  const activeCounts = await Enrollment.aggregate([
    {
      $match: {
        status: { $in: ACTIVE_ENROLLMENT_STATUSES },
      },
    },
    {
      $group: {
        _id: {
          course: '$course',
          semester: '$semester',
        },
        count: { $sum: 1 },
      },
    },
  ])

  const activeCountMap = new Map<string, number>()

  for (const entry of activeCounts) {
    const courseId = String(entry?._id?.course ?? '')
    const semester = String(entry?._id?.semester ?? '')
    const count = Number(entry?.count ?? 0)
    activeCountMap.set(`${courseId}|${semester}`, count)
  }

  const courses = await Course.find({}).select('_id semester enrolledCount').lean()
  const bulkOperations: Array<any> = []

  for (const course of courses) {
    const key = `${String(course._id)}|${String(course.semester ?? '')}`
    const computedCount = activeCountMap.get(key) ?? 0
    const normalizedCount = Math.min(computedCount, 50)
    const storedCount = Number(course.enrolledCount ?? 0)

    if (storedCount !== normalizedCount) {
      bulkOperations.push({
        updateOne: {
          filter: { _id: course._id },
          update: {
            $set: { enrolledCount: normalizedCount },
          },
        },
      })
    }
  }

  if (bulkOperations.length > 0) {
    await Course.bulkWrite(bulkOperations, { ordered: false })
  }
}

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

    if (collection === 'courses') {
      await syncAllCourseConstraints()
    }

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

    // If a student profile was created and the client requested default course assignment,
    // enroll the new student into a small set of courses for the current semester.
    try {
      if (resource && resource.model && resource.model.modelName === 'StudentProfile') {
        const profile = Array.isArray(createdRecord) ? createdRecord[0] : createdRecord
        const assignDefault = Boolean(body?.assignDefaultCourses)

        if (profile && assignDefault && profile.user) {
          const setting = await SystemSetting.findOne({ key: 'currentSemester' }).select('value')
          const semester = String(setting?.value ?? '')

          if (semester) {
            const defaultCourses = await Course.find({ semester }).limit(4).select('_id')

            if (defaultCourses.length > 0) {
              await Promise.all(
                defaultCourses.map((c) =>
                  Enrollment.updateOne(
                    { student: profile.user, course: c._id, semester },
                    {
                      $set: {
                        student: profile.user,
                        course: c._id,
                        semester,
                        status: 'enrolled',
                      },
                    },
                    { upsert: true }
                  )
                )
              )

              // Sync enrolled counts for affected courses
              await Promise.all(
                defaultCourses.map(async (c) => {
                  const count = await Enrollment.countDocuments({ course: c._id, semester, status: { $in: ['enrolled', 'pending'] } })
                  await Course.updateOne({ _id: c._id }, { $set: { enrolledCount: Math.min(count, 50) } })
                })
              )
            }
          }
        }
      }
    } catch (e) {
      // Don't fail the main create request if assignment fails; log to server console.
      // eslint-disable-next-line no-console
      console.error('Failed to auto-assign courses to new student profile:', e)
    }

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

    const previousEnrollment =
      collection === 'enrollments'
        ? await resource.model.findById(recordId).select('course semester status')
        : null

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

    if (collection === 'enrollments' && previousEnrollment) {
      const previousCourseId = String(previousEnrollment.course)
      const previousSemester = String(previousEnrollment.semester)
      const previousStatus = String(previousEnrollment.status)

      const nextCourseId = String((updatedRecord as any).course)
      const nextSemester = String((updatedRecord as any).semester)
      const nextStatus = String((updatedRecord as any).status)

      const shouldSyncPrevious =
        ACTIVE_ENROLLMENT_STATUSES.includes(previousStatus as (typeof ACTIVE_ENROLLMENT_STATUSES)[number]) &&
        (!ACTIVE_ENROLLMENT_STATUSES.includes(nextStatus as (typeof ACTIVE_ENROLLMENT_STATUSES)[number]) || previousCourseId !== nextCourseId || previousSemester !== nextSemester)

      const shouldSyncNext =
        ACTIVE_ENROLLMENT_STATUSES.includes(nextStatus as (typeof ACTIVE_ENROLLMENT_STATUSES)[number]) &&
        (!ACTIVE_ENROLLMENT_STATUSES.includes(previousStatus as (typeof ACTIVE_ENROLLMENT_STATUSES)[number]) || previousCourseId !== nextCourseId || previousSemester !== nextSemester)

      if (shouldSyncPrevious) {
        await syncCourseEnrolledCount(previousCourseId, previousSemester)
      }

      if (shouldSyncNext) {
        await syncCourseEnrolledCount(nextCourseId, nextSemester)
      }
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

    const previousEnrollment =
      resolved.collection === 'enrollments'
        ? await resource.model.findById(recordId).select('course semester status')
        : null

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

    if (
      resolved.collection === 'enrollments' &&
      previousEnrollment &&
      ACTIVE_ENROLLMENT_STATUSES.includes(String(previousEnrollment.status) as (typeof ACTIVE_ENROLLMENT_STATUSES)[number])
    ) {
      await syncCourseEnrolledCount(String(previousEnrollment.course), String(previousEnrollment.semester))
    }

    return apiSuccess(serializeRecord(deletedRecord))
  } catch (error) {
    return apiError(normalizeError(error), 500)
  }
}