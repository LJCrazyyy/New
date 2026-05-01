import { NextRequest } from 'next/server'
import { getFirestoreDb } from '@/lib/firebase'
import {
  AdminProfile,
  FacultyProfile,
  StudentProfile,
  User,
} from '@/lib/system-models'
import { normalizeError, serializeRecord } from '@/lib/api-resources'

export const runtime = 'nodejs'

const demoPasswordAliases: Record<'student' | 'faculty' | 'admin', string[]> = {
  student: ['student123', 'demo-student-password'],
  faculty: ['faculty123', 'demo-faculty-password'],
  admin: ['admin123', 'demo-admin-password'],
}

const demoAccounts: Record<'student' | 'faculty' | 'admin', { id: string; systemId: string; name: string; email: string; passwordHash: string }> = {
  student: {
    id: 'STU001',
    systemId: 'STU001',
    name: 'John Smith',
    email: 'student@school.com',
    passwordHash: 'student123',
  },
  faculty: {
    id: 'FACTEST001',
    systemId: 'FACTEST001',
    name: 'Test Faculty',
    email: 'faculty.test@school.com',
    passwordHash: 'faculty123',
  },
  admin: {
    id: 'ADM001',
    systemId: 'ADM001',
    name: 'Admin User',
    email: 'admin@school.com',
    passwordHash: 'admin123',
  },
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

function buildDemoUser(role: 'student' | 'faculty' | 'admin') {
  const account = demoAccounts[role]

  return {
    id: account.id,
    _id: account.id,
    systemId: account.systemId,
    name: account.name,
    email: account.email,
    role,
    status: 'active',
    passwordHash: account.passwordHash,
  }
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
    let userQuery = db.collection('users').where('email', '==', email)

    if (role) {
      userQuery = userQuery.where('role', '==', role)
    }

    const userSnapshot = await userQuery.limit(1).get()
    const userDoc = userSnapshot.docs[0]

    const user = userDoc
      ? { id: userDoc.id, _id: userDoc.id, ...userDoc.data() }
      : role && demoAccounts[role] && email === demoAccounts[role].email
        ? buildDemoUser(role)
        : null

    if (!user) {
      return apiError('Invalid email or password.', 401)
    }

    if (!isValidPassword(password, user.passwordHash, user.role)) {
      return apiError('Invalid email or password.', 401)
    }

    const safeUser = buildSafeUser(user)

    let profile: unknown = null

    if (user.role === 'student') {
      const profileSnapshot = await db.collection('studentprofiles').where('user', '==', user._id).limit(1).get()
      const profileDoc = profileSnapshot.docs[0]
      profile = profileDoc ? { id: profileDoc.id, _id: profileDoc.id, ...profileDoc.data() } : null
    }

    if (user.role === 'faculty') {
      const profileSnapshot = await db.collection('facultyprofiles').where('user', '==', user._id).limit(1).get()
      const profileDoc = profileSnapshot.docs[0]
      profile = profileDoc ? { id: profileDoc.id, _id: profileDoc.id, ...profileDoc.data() } : null
    }

    if (user.role === 'admin') {
      const profileSnapshot = await db.collection('adminprofiles').where('user', '==', user._id).limit(1).get()
      const profileDoc = profileSnapshot.docs[0]
      profile = profileDoc ? { id: profileDoc.id, _id: profileDoc.id, ...profileDoc.data() } : null
    }

    return apiSuccess({
      user: safeUser,
      profile: profile ? serializeRecord(profile) : null,
    })
  } catch (error) {
    return apiError(normalizeError(error), 500)
  }
}