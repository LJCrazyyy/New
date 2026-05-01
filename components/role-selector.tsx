'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, Shield } from 'lucide-react'

interface RoleSelectorProps {
  onSelectRole: (role: 'student' | 'faculty' | 'admin') => void
}

export function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  const roles = [
    {
      id: 'student',
      name: 'Student',
      description: 'View your courses, grades, and academic progress',
      icon: BookOpen,
      color: 'bg-blue-500/20 border-blue-500/50'
    },
    {
      id: 'faculty',
      name: 'Faculty',
      description: 'Manage courses, grades, and student performance',
      icon: Users,
      color: 'bg-purple-500/20 border-purple-500/50'
    },
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Manage users, courses, and system settings',
      icon: Shield,
      color: 'bg-amber-500/20 border-amber-500/50'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Academic Management System</h1>
          <p className="text-gray-400">Select your role to access the dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon

            return (
              <button
                key={role.id}
                type="button"
                className="text-left"
                onClick={() => onSelectRole(role.id as 'student' | 'faculty' | 'admin')}
              >
                <Card className={`h-full border-2 transition-all bg-gray-900 border-gray-800 hover:border-gray-700 hover:-translate-y-1 ${role.color}`}>
                  <CardHeader>
                    <div className="flex items-center justify-center mb-4">
                      <div className={`p-3 rounded-lg ${role.color}`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-center text-white">{role.name}</CardTitle>
                    <CardDescription className="text-center text-gray-400">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="w-full rounded-md border border-white/10 bg-white/10 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-white/20">
                      Continue as {role.name}
                    </div>
                  </CardContent>
                </Card>
                </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
