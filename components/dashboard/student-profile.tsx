'use client'

import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function StudentProfile() {
  // Mock student data
  const student = {
    name: 'Alex Johnson',
    studentNo: '2024-001',
    email: 'alex.johnson@university.edu',
    course: 'BS Information Technology',
    section: 'BSIT-2A',
    yearLevel: '2nd Year',
    admissionDate: 'August 2023',
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center text-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
            AJ
          </AvatarFallback>
        </Avatar>

        <div>
          <h2 className="text-xl font-bold text-foreground">{student.name}</h2>
          <p className="text-sm text-muted-foreground">{student.studentNo}</p>
        </div>

        <div className="w-full space-y-3 pt-4 border-t border-border">
          <div className="text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Course</p>
            <p className="text-sm text-foreground">{student.course}</p>
          </div>

          <div className="text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Section</p>
            <p className="text-sm text-foreground">{student.section}</p>
          </div>

          <div className="text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Year Level</p>
            <p className="text-sm text-foreground">{student.yearLevel}</p>
          </div>

          <div className="text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Email</p>
            <p className="text-sm text-foreground break-all">{student.email}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
