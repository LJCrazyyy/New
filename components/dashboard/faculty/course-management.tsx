import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Users, Calendar, BookOpen } from 'lucide-react'

export function CourseManagement() {
  const courses = [
    {
      id: 'CS101',
      name: 'Introduction to Programming',
      code: 'CS101',
      section: '01',
      schedule: 'MWF 10:00-11:00 AM',
      room: 'Science Bldg 101',
      students: 45,
      units: 3,
      semester: 'Spring 2024'
    },
    {
      id: 'CS301',
      name: 'Data Structures',
      code: 'CS301',
      section: '02',
      schedule: 'TTh 14:00-15:30',
      room: 'Science Bldg 205',
      students: 32,
      units: 3,
      semester: 'Spring 2024'
    },
    {
      id: 'CS401',
      name: 'Database Systems',
      code: 'CS401',
      section: '01',
      schedule: 'MWF 13:00-14:00',
      room: 'Science Bldg 301',
      students: 28,
      units: 4,
      semester: 'Spring 2024'
    }
  ]

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Courses
            </CardTitle>
            <CardDescription>Spring 2024 Semester</CardDescription>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Edit className="h-4 w-4 mr-2" />
            Manage
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
                  <p className="text-white font-medium">{course.schedule}</p>
                </div>
                <div>
                  <p className="text-gray-400">Room</p>
                  <p className="text-white font-medium">{course.room}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400">Students</p>
                    <p className="text-white font-medium">{course.students}</p>
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
