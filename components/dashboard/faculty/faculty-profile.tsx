import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, MapPin } from 'lucide-react'

export function FacultyProfile() {
  const facultyData = {
    name: 'Dr. John Smith',
    department: 'Computer Science',
    employeeId: 'FAC-2024-001',
    email: 'john.smith@university.edu',
    phone: '(555) 123-4567',
    office: 'Science Building, Room 305',
    qualification: 'Ph.D. in Computer Science',
    status: 'Active',
    yearsOfService: 8
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Faculty Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">JS</span>
          </div>
          <h3 className="text-lg font-bold text-white">{facultyData.name}</h3>
          <p className="text-sm text-gray-400">{facultyData.qualification}</p>
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-700">
          <div className="flex items-start gap-2">
            <span className="text-gray-500 text-sm w-24">ID:</span>
            <span className="text-white text-sm">{facultyData.employeeId}</span>
          </div>
          
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
            <span className="text-white text-sm">{facultyData.email}</span>
          </div>

          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
            <span className="text-white text-sm">{facultyData.phone}</span>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
            <span className="text-white text-sm">{facultyData.office}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-700 space-y-2">
          <div className="text-xs text-gray-400">Department</div>
          <Badge className="bg-purple-600/50 text-purple-200">{facultyData.department}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-700">
          <div>
            <p className="text-xs text-gray-400">Status</p>
            <Badge className="bg-green-600/50 text-green-200">{facultyData.status}</Badge>
          </div>
          <div>
            <p className="text-xs text-gray-400">Service</p>
            <p className="text-white text-sm font-semibold">{facultyData.yearsOfService} years</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
