'use client'

import { useEffect, useState } from 'react'
import { RoleSelector } from '@/components/role-selector'
import { LoginPage, type UserData } from '@/components/login-page'
import { StudentDashboard } from '@/components/dashboard/student-dashboard'
import { FacultyDashboard } from '@/components/dashboard/faculty-dashboard'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL=https://new-production-dfd5.up.railway.app(/\/$/, '') ?? ''

type AppState = 'role-select' | 'login' | 'dashboard'
type UserRole = 'student' | 'faculty' | 'admin'
const SESSION_STORAGE_KEY = 'campus.currentUser'

export default function Page() {
  const [appState, setAppState] = useState<AppState>('role-select')
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)

  useEffect(() => {
    try {
      const rawSession = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!rawSession) {
        return
      }

      const parsedSession = JSON.parse(rawSession) as UserData
      if (!parsedSession?.id || !parsedSession?.role) {
        return
      }

      setCurrentUser(parsedSession)
      setSelectedRole(parsedSession.role)
      setAppState('dashboard')
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (!API_BASE_URL || typeof window === 'undefined') {
      return
    }

    const originalFetch = window.fetch.bind(window)
    if ((window as any).__apiBaseUrlPatched) {
      return
    }

    window.fetch = async (input: RequestInfo, init?: RequestInit) => {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        input = `${API_BASE_URL}${input}`
      } else if (input instanceof Request) {
        const url = new URL(input.url)
        if (url.pathname.startsWith('/api/')) {
          const targetUrl = `${API_BASE_URL}${url.pathname}${url.search}`
          input = new Request(targetUrl, input)
        }
      }
      return originalFetch(input, init)
    }

    ;(window as any).__apiBaseUrlPatched = true
  }, [])

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setAppState('login')
  }

  const handleLoginSuccess = (user: UserData) => {
    setCurrentUser(user)
    setSelectedRole(user.role)
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
    setAppState('dashboard')
  }

  const handleBackToRoles = () => {
    setSelectedRole(null)
    setAppState('role-select')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setSelectedRole(null)
    localStorage.removeItem(SESSION_STORAGE_KEY)
    setAppState('role-select')
  }

  // Role Select State
  if (appState === 'role-select') {
    return <RoleSelector onSelectRole={handleRoleSelect} />
  }

  // Login State
  if (appState === 'login' && selectedRole) {
    return (
      <LoginPage
        role={selectedRole}
        onLoginSuccess={handleLoginSuccess}
        onBack={handleBackToRoles}
      />
    )
  }

  // Dashboard State
  if (appState === 'dashboard' && currentUser) {
    if (currentUser.role === 'student') {
      return <StudentDashboard currentUser={currentUser} onLogout={handleLogout} />
    }

    if (currentUser.role === 'faculty') {
      return <FacultyDashboard currentUser={currentUser} onLogout={handleLogout} />
    }

    if (currentUser.role === 'admin') {
      return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
    }
  }

  return null
}
