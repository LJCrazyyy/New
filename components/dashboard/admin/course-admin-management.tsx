import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Plus } from 'lucide-react'

export function CourseAdminManagement() {
  const courses = [
    { id: 'CS101', code: 'CS101', name: 'Introduction to Programming', faculty: 'Dr. John Smith', students: 45, units: 3, status: 'Active' },
    { id: 'CS301', code: 'CS301', name: 'Data Structures', faculty: 'Dr. John Smith', students: 32, units: 3, status: 'Active' },
    { id: 'CS401', code: 'CS401', name: 'Database Systems', faculty: 'Dr. John Smith', students: 28, units: 4, status: 'Active' },
    { id: 'MATH101', code: 'MATH101', name: 'Calculus I', faculty: 'Dr. Sarah Lee', students: 52, units: 4, status: 'Active' },
    { id: 'ENG101', code: 'ENG101', name: 'English Composition', faculty: 'Prof. Maria Garcia', students: 35, units: 3, status: 'Inactive' }
  ]

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Course Management</CardTitle>
            <CardDescription>Manage all academic courses and curriculum</CardDescription>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4 mr-2" />
            New Course
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            placeholder="Search courses by code or name..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Course Code</th>
                <th className="text-left py-3 px-4 text-gray-400">Course Name</th>
                <th className="text-center py-3 px-4 text-gray-400">Faculty</th>
                <th className="text-center py-3 px-4 text-gray-400">Students</th>
                <th className="text-center py-3 px-4 text-gray-400">Units</th>
                <th className="text-center py-3 px-4 text-gray-400">Status</th>
                <th className="text-center py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-mono">{course.code}</td>
                  <td className="py-3 px-4 text-white">{course.name}</td>
                  <td className="py-3 px-4 text-center text-gray-400 text-xs">{course.faculty}</td>
                  <td className="py-3 px-4 text-center text-white">{course.students}</td>
                  <td className="py-3 px-4 text-center text-white">{course.units}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={course.status === 'Active' ? 'bg-green-600/50 text-green-200' : 'bg-gray-600/50 text-gray-200'}>
                      {course.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center space-x-1">
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
