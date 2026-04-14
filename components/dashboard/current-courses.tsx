'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'

interface CurrentCoursesProps {
  fullWidth?: boolean
}

export function CurrentCourses({ fullWidth }: CurrentCoursesProps) {
  // Mock course data
  const courses = [
    {
      id: 1,
      code: 'CS101',
      name: 'Data Structures',
      instructor: 'Dr. Maria Santos',
      schedule: 'MWF 9:00 AM - 10:30 AM',
      room: 'Room 301',
      units: 3,
      status: 'Active',
    },
    {
      id: 2,
      code: 'CS102',
      name: 'Web Development',
      instructor: 'Prof. John Reyes',
      schedule: 'TTh 1:00 PM - 2:30 PM',
      room: 'Room 205',
      units: 3,
      status: 'Active',
    },
    {
      id: 3,
      code: 'IT150',
      name: 'Database Systems',
      instructor: 'Dr. Carlos Gonzalez',
      schedule: 'MWF 2:00 PM - 3:30 PM',
      room: 'Lab 101',
      units: 4,
      status: 'Active',
    },
    {
      id: 4,
      code: 'MATH201',
      name: 'Advanced Calculus',
      instructor: 'Prof. Ana Martinez',
      schedule: 'TTh 10:00 AM - 11:30 AM',
      room: 'Room 401',
      units: 3,
      status: 'Active',
    },
  ]

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
            Total Units This Semester: <span className="font-semibold text-foreground">13 units</span>
          </p>
        </div>
      )}
    </Card>
  )
}
