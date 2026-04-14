import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, Plus } from 'lucide-react'

export function EnrollmentManagement() {
  const enrollments = [
    { id: 'ENR001', studentName: 'Alice Johnson', course: 'CS101', status: 'Enrolled', enrollDate: '2024-01-15' },
    { id: 'ENR002', studentName: 'Bob Williams', course: 'CS301', status: 'Pending', enrollDate: '2024-03-10' },
    { id: 'ENR003', studentName: 'Carol Davis', course: 'CS401', status: 'Enrolled', enrollDate: '2024-01-15' },
    { id: 'ENR004', studentName: 'David Brown', course: 'MATH101', status: 'Enrolled', enrollDate: '2024-01-15' },
    { id: 'ENR005', studentName: 'Eve Martinez', course: 'ENG101', status: 'Rejected', enrollDate: '2024-02-20' },
    { id: 'ENR006', studentName: 'Frank Garcia', course: 'CS101', status: 'Enrolled', enrollDate: '2024-01-15' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Enrolled':
        return 'bg-green-900/30 text-green-200 border-green-700'
      case 'Pending':
        return 'bg-yellow-900/30 text-yellow-200 border-yellow-700'
      case 'Rejected':
        return 'bg-red-900/30 text-red-200 border-red-700'
      default:
        return 'bg-gray-700/30 text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Enrolled':
        return <CheckCircle className="h-4 w-4" />
      case 'Pending':
        return <Clock className="h-4 w-4" />
      case 'Rejected':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Enrollment Management</CardTitle>
            <CardDescription>Process and manage student course enrollments</CardDescription>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4 mr-2" />
            New Enrollment
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            placeholder="Search enrollments by student or course..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Student Name</th>
                <th className="text-left py-3 px-4 text-gray-400">Course</th>
                <th className="text-center py-3 px-4 text-gray-400">Status</th>
                <th className="text-center py-3 px-4 text-gray-400">Enrollment Date</th>
                <th className="text-center py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enroll) => (
                <tr key={enroll.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-medium">{enroll.studentName}</td>
                  <td className="py-3 px-4 text-gray-400">{enroll.course}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Badge className={`${getStatusColor(enroll.status)} border`}>
                        {getStatusIcon(enroll.status)}
                        <span className="ml-1">{enroll.status}</span>
                      </Badge>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-400 text-xs">{enroll.enrollDate}</td>
                  <td className="py-3 px-4 text-center">
                    {enroll.status === 'Pending' && (
                      <div className="space-x-1">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Approve</Button>
                        <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:text-red-300">Reject</Button>
                      </div>
                    )}
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
