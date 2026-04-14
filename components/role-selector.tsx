'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Shield } from 'lucide-react'

interface RoleSelectorProps {
  onSelectRole: (role: 'student' | 'faculty' | 'admin') => void
}

export function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | 'admin' | null>(null)

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
            const isSelected = selectedRole === role.id

            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all border-2 ${
                  isSelected
                    ? `${role.color} shadow-lg scale-105`
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                }`}
                onClick={() => setSelectedRole(role.id as 'student' | 'faculty' | 'admin')}
              >
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
              </Card>
            )
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => selectedRole && onSelectRole(selectedRole)}
            disabled={!selectedRole}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            Continue as {selectedRole ? roles.find(r => r.id === selectedRole)?.name : 'Role'}
          </Button>
        </div>
      </div>
    </div>
  )
}
