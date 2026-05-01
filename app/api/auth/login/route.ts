import { NextRequest } from 'next/server'
import { getFirestoreDb } from '@/lib/firebase'
import { normalizeError, serializeRecord } from '@/lib/api-resources'

export const runtime = 'nodejs'

const demoPasswordAliases: Record<'student' | 'faculty' | 'admin', string[]> = {
  student: ['student123', 'demo-student-password'],
  faculty: ['faculty123', 'demo-faculty-password'],
  admin: ['admin123', 'demo-admin-password'],
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

function buildSafeUser(userRecord: any) {
  const serializedUser = serializeRecord(userRecord) as Record<string, unknown> & { passwordHash?: string }
  const { passwordHash: _passwordHash, ...safeUser } = serializedUser
  return safeUser
}

function isValidPassword(inputPassword: string, storedPassword: string | undefined, userRole: unknown) {
  if (!storedPassword) {
    return false
  }

  if (inputPassword === storedPassword) {
    return true
  }

  if (userRole !== 'student' && userRole !== 'faculty' && userRole !== 'admin') {
    return false
  }

  return demoPasswordAliases[userRole].includes(inputPassword) && demoPasswordAliases[userRole].includes(storedPassword)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body !== 'object') {
    return apiError('Email and password are required.', 400)
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const role = typeof body.role === 'string' ? body.role.trim().toLowerCase() : ''

  if (!email || !password) {
    return apiError('Email and password are required.', 400)
  }

  try {
    const db = getFirestoreDb()
    const userQuery = db.collection('users').where('email', '==', email)

    const userSnapshot = role ? await userQuery.where('role', '==', role).limit(1).get() : await userQuery.limit(1).get()
    const userDoc = userSnapshot.docs[0]

    if (!userDoc) {
      return apiError('Invalid email or password.', 401)
    }

    const user = { id: userDoc.id, _id: userDoc.id, ...userDoc.data() }

    if (!isValidPassword(password, user.passwordHash, user.role)) {
      return apiError('Invalid email or password.', 401)
    }

    const safeUser = buildSafeUser(user)

    let profile: unknown = null

    if (user.role === 'student') {
      const profileSnapshot = await db.collection('studentprofiles').where('user', '==', user._id).limit(1).get()
      profile = profileSnapshot.docs[0] ? { id: profileSnapshot.docs[0].id, _id: profileSnapshot.docs[0].id, ...profileSnapshot.docs[0].data() } : null
    }

    if (user.role === 'faculty') {
      const profileSnapshot = await db.collection('facultyprofiles').where('user', '==', user._id).limit(1).get()
      profile = profileSnapshot.docs[0] ? { id: profileSnapshot.docs[0].id, _id: profileSnapshot.docs[0].id, ...profileSnapshot.docs[0].data() } : null
    }

    if (user.role === 'admin') {
      const profileSnapshot = await db.collection('adminprofiles').where('user', '==', user._id).limit(1).get()
      profile = profileSnapshot.docs[0] ? { id: profileSnapshot.docs[0].id, _id: profileSnapshot.docs[0].id, ...profileSnapshot.docs[0].data() } : null
    }

    return apiSuccess({
      user: safeUser,
      profile: profile ? serializeRecord(profile) : null,
    })
  } catch (error) {
    const normalized = normalizeError(error)

    if (typeof normalized === 'string' && normalized.includes('RESOURCE_EXHAUSTED')) {
      return apiError('Service temporarily unavailable: quota exceeded. Please try again later or contact the administrator.', 503, {
        raw: normalized,
      })
    }

    return apiError(normalized, 500)
  }
}