import type { FirestoreModel } from '@/lib/firestore-model'
import {
  AcademicHistory,
  AdminProfile,
  AuditLog,
  Attendance,
  AttendanceLog,
  ActivitySubmission,
  CounselingRecord,
  Course,
  CourseActivity,
  CoursePrerequisite,
  DisciplineRecord,
  Enrollment,
  FacultyProfile,
  GradeScale,
  MedicalRecord,
  StudentDocument,
  StudentOrganization,
  StudentProfile,
  SystemSetting,
  User,
} from '@/lib/system-models'

type PopulateConfig = Array<string | Record<string, unknown>>

export type ApiResourceConfig = {
  model: FirestoreModel<any>
  searchableFields: string[]
  defaultSort?: string
  defaultPopulate?: PopulateConfig
}

export const apiResources: Record<string, ApiResourceConfig> = {
  users: {
    model: User,
    searchableFields: ['systemId', 'name', 'email', 'role', 'status'],
    defaultSort: '-createdAt',
  },
  'student-profiles': {
    model: StudentProfile,
    searchableFields: ['studentNumber', 'course', 'section', 'yearLevel'],
    defaultSort: '-createdAt',
    defaultPopulate: [{ path: 'user', select: 'systemId name email role status' }],
  },
  'faculty-profiles': {
    model: FacultyProfile,
    searchableFields: ['employeeNumber', 'department', 'title', 'office'],
    defaultSort: '-createdAt',
    defaultPopulate: [
      { path: 'user', select: 'systemId name email role status' },
      { path: 'coursesAssigned', select: 'code name section semester room units faculty enrolledCount capacity' },
    ],
  },
  'admin-profiles': {
    model: AdminProfile,
    searchableFields: ['employeeNumber', 'permissions'],
    defaultSort: '-createdAt',
    defaultPopulate: [{ path: 'user', select: 'systemId name email role status' }],
  },
  courses: {
    model: Course,
    searchableFields: ['code', 'name', 'section', 'semester', 'schedule', 'room'],
    defaultSort: 'code',
    defaultPopulate: [{ path: 'faculty', select: 'systemId name email role status' }],
  },
  enrollments: {
    model: Enrollment,
    searchableFields: ['semester', 'status', 'gradeLetter'],
    defaultSort: '-createdAt',
    defaultPopulate: [
      { path: 'student', select: 'systemId name email role status' },
      {
        path: 'course',
        select: 'code name section semester schedule room units enrolledCount capacity faculty',
        populate: { path: 'faculty', select: 'systemId name email role status' },
      },
    ],
  },
  'academic-history': {
    model: AcademicHistory,
    searchableFields: ['type', 'description', 'details'],
    defaultSort: '-recordedAt',
    defaultPopulate: [
      { path: 'student', select: 'systemId name email role status' },
      { path: 'relatedCourse', select: 'code name section semester room units' },
      { path: 'createdBy', select: 'systemId name email role status' },
    ],
  },
  'medical-records': {
    model: MedicalRecord,
    searchableFields: ['title', 'category', 'notes', 'status'],
    defaultSort: '-recordedAt',
    defaultPopulate: [{ path: 'student', select: 'systemId name email role status' }],
  },
  'counseling-records': {
    model: CounselingRecord,
    searchableFields: ['topic', 'summary', 'nextStep'],
    defaultSort: '-sessionDate',
    defaultPopulate: [
      { path: 'student', select: 'systemId name email role status' },
      { path: 'counselor', select: 'systemId name email role status' },
      { path: 'replyBy', select: 'systemId name email role status' },
    ],
  },
  'discipline-records': {
    model: DisciplineRecord,
    searchableFields: ['incident', 'severity', 'status', 'actionTaken'],
    defaultSort: '-incidentDate',
    defaultPopulate: [{ path: 'student', select: 'systemId name email role status' }],
  },
  'student-documents': {
    model: StudentDocument,
    searchableFields: ['title', 'category', 'fileName', 'status'],
    defaultSort: '-createdAt',
    defaultPopulate: [{ path: 'student', select: 'systemId name email role status' }],
  },
  'student-organizations': {
    model: StudentOrganization,
    searchableFields: ['organizationName', 'role', 'status'],
    defaultSort: '-joinedAt',
    defaultPopulate: [{ path: 'student', select: 'systemId name email role status' }],
  },
  'audit-logs': {
    model: AuditLog,
    searchableFields: ['action', 'entity', 'entityId', 'details'],
    defaultSort: '-occurredAt',
    defaultPopulate: [{ path: 'actor', select: 'systemId name email role status' }],
  },
  'system-settings': {
    model: SystemSetting,
    searchableFields: ['key', 'description'],
    defaultSort: 'key',
  },
  'attendance': {
    model: Attendance,
    searchableFields: ['semester'],
    defaultSort: '-lastUpdated',
    defaultPopulate: [
      { path: 'student', select: 'systemId name email role status' },
      { path: 'course', select: 'code name section semester' },
    ],
  },
  'attendance-logs': {
    model: AttendanceLog,
    searchableFields: ['status', 'remarks'],
    defaultSort: '-sessionDate',
    defaultPopulate: [
      { path: 'attendance', select: 'semester' },
    ],
  },
  'grade-scales': {
    model: GradeScale,
    searchableFields: ['institution', 'letterGrade', 'description'],
    defaultSort: '-maxScore',
  },
  'course-prerequisites': {
    model: CoursePrerequisite,
    searchableFields: ['minGrade'],
    defaultSort: '-createdAt',
    defaultPopulate: [
      { path: 'course', select: 'code name section semester' },
      { path: 'prerequisiteCourse', select: 'code name section semester' },
    ],
  },
  'course-activities': {
    model: CourseActivity,
    searchableFields: ['title', 'description', 'type', 'status'],
    defaultSort: '-createdAt',
    defaultPopulate: [
      { path: 'course', select: 'code name section semester' },
      { path: 'faculty', select: 'systemId name email role status' },
    ],
  },
  'activity-submissions': {
    model: ActivitySubmission,
    searchableFields: ['status', 'answer', 'feedback'],
    defaultSort: '-submittedAt',
    defaultPopulate: [
      { path: 'activity', select: 'title type dueDate points course faculty' },
      { path: 'course', select: 'code name section semester' },
      { path: 'student', select: 'systemId name email role status' },
      { path: 'gradedBy', select: 'systemId name email role status' },
    ],
  },
}

export function isValidObjectId(value: string) {
  return typeof value === 'string' && value.trim().length > 0 && !value.includes('/')
}

export function serializeRecord(record: any): any {
  if (record == null) {
    return record
  }

  if (Array.isArray(record)) {
    return record.map((item) => serializeRecord(item))
  }

  if (typeof record.toObject === 'function') {
    const plainRecord = record.toObject({ virtuals: true, versionKey: false }) as Record<string, unknown> & {
      _id?: { toString?: () => string } | string
    }

    const serializedRecord = {
      ...plainRecord,
      id:
        typeof plainRecord._id === 'object' && plainRecord._id && 'toString' in plainRecord._id && typeof plainRecord._id.toString === 'function'
          ? plainRecord._id.toString()
          : typeof plainRecord._id === 'string'
            ? plainRecord._id
            : plainRecord.id,
    }

    return serializeRecord(serializedRecord)
  }

  if (typeof record === 'object' && record.constructor === Object) {
    return Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key, serializeRecord(value)])
    )
  }

  return record
}

export function getResourceConfig(collectionName: string) {
  return apiResources[collectionName]
}

export function buildQueryFilter(collectionName: string, searchParams: URLSearchParams) {
  const resource = getResourceConfig(collectionName)
  const filter: Record<string, unknown> = {}
  const searchTerm = searchParams.get('search')?.trim()

  if (searchTerm && resource?.searchableFields.length > 0) {
    filter.$or = resource.searchableFields.map((field) => ({
      [field]: { $regex: searchTerm, $options: 'i' },
    }))
  }

  for (const [key, value] of searchParams.entries()) {
    if (['page', 'limit', 'sort', 'order', 'populate', 'search'].includes(key)) {
      continue
    }

    if (value === '') {
      continue
    }

    if (value === 'true') {
      filter[key] = true
      continue
    }

    if (value === 'false') {
      filter[key] = false
      continue
    }

    if (/^-?\d+(?:\.\d+)?$/.test(value)) {
      filter[key] = Number(value)
      continue
    }

    filter[key] = value
  }

  return filter
}

export function buildSortClause(collectionName: string, searchParams: URLSearchParams) {
  const resource = getResourceConfig(collectionName)
  const sort = searchParams.get('sort')?.trim()
  const order = searchParams.get('order')?.trim().toLowerCase()

  if (sort) {
    const field = sort.replace(/^-/, '')
    return order === 'asc' ? field : order === 'desc' ? `-${field}` : sort
  }

  return resource?.defaultSort ?? '-createdAt'
}

export function buildPagination(searchParams: URLSearchParams) {
  const pageValue = Number(searchParams.get('page') ?? '1')
  const limitValue = Number(searchParams.get('limit') ?? '25')

  const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 100) : 25

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  }
}

export function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown server error'
}

export async function parseJsonBody(request: Request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function applyPopulate(model: FirestoreModel<any>, document: any, collectionName: string, populateParam?: string | null) {
  const resource = getResourceConfig(collectionName)
  const explicitPopulate = populateParam
    ? populateParam
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : []

  const populateConfig = [...(resource?.defaultPopulate ?? []), ...explicitPopulate]

  if (populateConfig.length === 0) {
    return document
  }

  return model.populate(document, populateConfig as never)
}
