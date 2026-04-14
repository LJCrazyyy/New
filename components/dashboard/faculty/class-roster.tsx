import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Download, Mail } from 'lucide-react'

export function ClassRoster() {
  const students = [
    { id: 'STU001', name: 'Alice Johnson', email: 'alice@university.edu', year: '2nd', status: 'Active' },
    { id: 'STU002', name: 'Bob Williams', email: 'bob@university.edu', year: '2nd', status: 'Active' },
    { id: 'STU003', name: 'Carol Davis', email: 'carol@university.edu', year: '3rd', status: 'Active' },
    { id: 'STU004', name: 'David Brown', email: 'david@university.edu', year: '2nd', status: 'Active' },
    { id: 'STU005', name: 'Eve Martinez', email: 'eve@university.edu', year: '3rd', status: 'Inactive' },
    { id: 'STU006', name: 'Frank Garcia', email: 'frank@university.edu', year: '2nd', status: 'Active' }
  ]

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Class Roster
            </CardTitle>
            <CardDescription>CS101 - Introduction to Programming ({students.length} students)</CardDescription>
          </div>
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            placeholder="Search student name or ID..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Student Name</th>
                <th className="text-left py-3 px-4 text-gray-400">ID</th>
                <th className="text-left py-3 px-4 text-gray-400">Email</th>
                <th className="text-center py-3 px-4 text-gray-400">Year</th>
                <th className="text-center py-3 px-4 text-gray-400">Status</th>
                <th className="text-center py-3 px-4 text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-medium">{student.name}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{student.id}</td>
                  <td className="py-3 px-4">
                    <a href={`mailto:${student.email}`} className="text-blue-400 hover:text-blue-300 text-xs">
                      {student.email}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-center text-white">{student.year}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={student.status === 'Active' ? 'bg-green-600/50 text-green-200' : 'bg-red-600/50 text-red-200'}>
                      {student.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                      <Mail className="h-4 w-4" />
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
