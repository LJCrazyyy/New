'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'

interface LoginPageProps {
  role: 'student' | 'faculty' | 'admin'
  onLoginSuccess: (user: UserData) => void
  onBack: () => void
}

export interface UserData {
  id: string
  name: string
  email: string
  role: 'student' | 'faculty' | 'admin'
}

const demoUsers: Record<string, { email: string; password: string; user: UserData }> = {
  student: {
    email: 'aaron.adams@school.edu',
    password: 'student123',
    user: {
      id: 'STU001',
      name: 'Aaron Adams',
      email: 'aaron.adams@school.edu',
      role: 'student',
    },
  },
  faculty: {
    email: 'faculty@school.com',
    password: 'faculty123',
    user: {
      id: 'FAC001',
      name: 'Dr. Maria Garcia',
      email: 'faculty@school.com',
      role: 'faculty',
    },
  },
  admin: {
    email: 'admin@school.com',
    password: 'admin123',
    user: {
      id: 'ADM001',
      name: 'Admin User',
      email: 'admin@school.com',
      role: 'admin',
    },
  },
}

const defaultPasswords: Record<'student' | 'faculty' | 'admin', string> = {
  student: 'student123',
  faculty: 'faculty123',
  admin: 'admin123',
}

export function LoginPage({ role, onLoginSuccess, onBack }: LoginPageProps) {
  const [email, setEmail] = useState(demoUsers[role].email)
  const [password, setPassword] = useState(demoUsers[role].password)
  const [studentPage, setStudentPage] = useState(1)
  const [studentPages, setStudentPages] = useState(1)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const loadRoleAccount = async (targetRole: LoginPageProps['role'], page = 1) => {
    if (targetRole !== 'student') {
      setStudentPages(1)
      setEmail(demoUsers[targetRole].email)
      setPassword(defaultPasswords[targetRole])
      return
    }

    try {
      const response = await fetch(`/api/users?role=${targetRole}&limit=1&page=${page}&sort=name&order=asc`)
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load demo account.')
      }

      const account = Array.isArray(payload.data) ? payload.data[0] : null
      const pagesFromMeta = Number(payload?.meta?.pagination?.pages)

      setStudentPages(Number.isFinite(pagesFromMeta) && pagesFromMeta > 0 ? pagesFromMeta : 1)

      if (account?.email) {
        setEmail(account.email)
        setPassword(defaultPasswords[targetRole])
        return
      }

      setEmail(demoUsers[targetRole].email)
      setPassword(demoUsers[targetRole].password)
    } catch {
      setEmail(demoUsers[targetRole].email)
      setPassword(demoUsers[targetRole].password)
    }
  }

  useEffect(() => {
    setStudentPage(1)
    loadRoleAccount(role, 1)
  }, [role])

  const onNextStudent = () => {
    const nextPage = studentPage >= studentPages ? 1 : studentPage + 1
    setStudentPage(nextPage)
    loadRoleAccount('student', nextPage)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Invalid email or password')
      }

      const loggedInUser = payload.data.user

      onLoginSuccess({
        id: loggedInUser.id || loggedInUser.systemId,
        name: loggedInUser.name,
        email: loggedInUser.email,
        role: loggedInUser.role,
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const roleDisplayName = {
    student: 'Student',
    faculty: 'Faculty',
    admin: 'Administrator',
  }[role]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">{roleDisplayName} Login</CardTitle>
          <CardDescription className="text-gray-400">
            Sign in to your {roleDisplayName.toLowerCase()} account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email Address</label>
              <Input
                type="email"
                placeholder={demoUsers[role].email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              {role === 'student' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onNextStudent}
                  disabled={isLoading}
                  className="w-full text-gray-300 border-gray-700 hover:bg-gray-800"
                >
                  Next Student
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
                className="w-full text-gray-300 border-gray-700 hover:bg-gray-800"
              >
                Back to Roles
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                Demo credentials pre-filled
              </p>
              <p className="text-xs text-gray-600 text-center mt-2">
                Email: {email || demoUsers[role].email}
                <br />
                Password: {defaultPasswords[role]}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
