import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen } from 'lucide-react'

interface CourseManagementProps {
  courses: Array<{
    id: string
    name: string
    code: string
    section: string
    schedule: string
    room: string
    enrolledCount: number
    units: number
    semester: string
  }>
  fullWidth?: boolean
}

export function CourseManagement({ courses, fullWidth }: CourseManagementProps) {

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Courses
            </CardTitle>
            <CardDescription>{courses.length} assigned courses</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={fullWidth ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'}>
          {courses.map((course) => (
            <div key={course.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{course.name}</h3>
                    <Badge variant="outline" className="bg-purple-900/30 text-purple-200 border-purple-700">
                      {course.code}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">{course.semester} • Section {course.section}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-gray-400">Schedule</p>
                  <p className="text-white font-medium">{course.schedule || 'TBA'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Room</p>
                  <p className="text-white font-medium">{course.room || 'TBA'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400">Students</p>
                    <p className="text-white font-medium">{course.enrolledCount ?? 0}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400">Units</p>
                  <p className="text-white font-medium">{course.units}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
