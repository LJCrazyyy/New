'use client'

import { useState } from 'react'
import { RoleSelector } from '@/components/role-selector'
import { LoginPage, type UserData } from '@/components/login-page'
import { StudentDashboard } from '@/components/dashboard/student-dashboard'
import { FacultyDashboard } from '@/components/dashboard/faculty-dashboard'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'

type AppState = 'role-select' | 'login' | 'dashboard'
type UserRole = 'student' | 'faculty' | 'admin'

export default function Page() {
  const [appState, setAppState] = useState<AppState>('role-select')
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setAppState('login')
  }

  const handleLoginSuccess = (user: UserData) => {
    setCurrentUser(user)
    setAppState('dashboard')
  }

  const handleBackToRoles = () => {
    setSelectedRole(null)
    setAppState('role-select')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setSelectedRole(null)
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
      return <StudentDashboard onLogout={handleLogout} />
    }

    if (currentUser.role === 'faculty') {
      return <FacultyDashboard onLogout={handleLogout} />
    }

    if (currentUser.role === 'admin') {
      return <AdminDashboard onLogout={handleLogout} />
    }
  }

  return null
}
