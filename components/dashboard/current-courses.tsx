'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'

interface CurrentCoursesProps {
  courses: Array<{
    id: string
    code: string
    name: string
    instructor: string
    schedule: string
    room: string
    units: number
    status: string
  }>
  fullWidth?: boolean
}

export function CurrentCourses({ courses, fullWidth }: CurrentCoursesProps) {
  const totalUnits = courses.reduce((sum, course) => sum + (course.units ?? 0), 0)

  return (
    <Card className={`p-6 ${fullWidth ? '' : ''}`}>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Current Courses</h3>
        <Badge variant="secondary">{courses.length}</Badge>
      </div>

      <div className={`${fullWidth ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}`}>
        {courses.map((course) => (
          <div
            key={course.id}
            className={`p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors ${
              fullWidth ? '' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">{course.code}</p>
                <p className="font-semibold text-foreground text-sm">{course.name}</p>
              </div>
              <Badge variant="outline" className="whitespace-nowrap">
                {course.units} units
              </Badge>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
              <div>
                <p className="font-medium text-foreground text-xs">{course.instructor}</p>
              </div>
              <p>{course.schedule}</p>
              <p>{course.room}</p>
            </div>
          </div>
        ))}
      </div>

      {fullWidth && (
        <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
          <p className="text-sm text-muted-foreground">
            Total Units This Semester: <span className="font-semibold text-foreground">{totalUnits} units</span>
          </p>
        </div>
      )}
    </Card>
  )
}
