'use client'

import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface StudentProfileProps {
  student?: {
    name?: string
    email?: string
    systemId?: string
  }
  profile?: {
    studentNumber?: string
    course?: string
    section?: string
    yearLevel?: string
  } | null
}

export function StudentProfile({ student, profile }: StudentProfileProps) {
  const initials = (student?.name ?? 'Student')
    .split(' ')
    .map((namePart) => namePart[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center text-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div>
          <h2 className="text-xl font-bold text-foreground">{student?.name ?? 'Student'}</h2>
          <p className="text-sm text-muted-foreground">{profile?.studentNumber ?? student?.systemId ?? 'N/A'}</p>
        </div>

        <div className="w-full space-y-3 pt-4 border-t border-border">
          <div className="text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Course</p>
            <p className="text-sm text-foreground">{profile?.course ?? 'N/A'}</p>
          </div>

          <div className="text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Section</p>
            <p className="text-sm text-foreground">{profile?.section ?? 'N/A'}</p>
          </div>

          <div className="text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Year Level</p>
            <p className="text-sm text-foreground">{profile?.yearLevel ?? 'N/A'}</p>
          </div>

          <div className="text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Email</p>
            <p className="text-sm text-foreground break-all">{student?.email ?? 'N/A'}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
