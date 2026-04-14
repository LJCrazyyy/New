import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckSquare, Download } from 'lucide-react'

export function AttendanceTracking() {
  const attendanceData = [
    { id: 'STU001', name: 'Alice Johnson', present: 42, absent: 2, late: 1, rate: 95 },
    { id: 'STU002', name: 'Bob Williams', present: 38, absent: 4, late: 2, rate: 87 },
    { id: 'STU003', name: 'Carol Davis', present: 43, absent: 1, late: 0, rate: 98 },
    { id: 'STU004', name: 'David Brown', present: 40, absent: 3, late: 1, rate: 92 },
    { id: 'STU005', name: 'Eve Martinez', present: 37, absent: 5, late: 2, rate: 85 },
    { id: 'STU006', name: 'Frank Garcia', present: 33, absent: 8, late: 3, rate: 76 }
  ]

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-900/30 text-green-200'
    if (rate >= 80) return 'bg-blue-900/30 text-blue-200'
    if (rate >= 70) return 'bg-yellow-900/30 text-yellow-200'
    return 'bg-red-900/30 text-red-200'
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Attendance Tracking
            </CardTitle>
            <CardDescription>Spring 2024 - Class Attendance Records</CardDescription>
          </div>
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Student</th>
                <th className="text-center py-3 px-4 text-gray-400">Present</th>
                <th className="text-center py-3 px-4 text-gray-400">Absent</th>
                <th className="text-center py-3 px-4 text-gray-400">Late</th>
                <th className="text-center py-3 px-4 text-gray-400">Rate</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record) => (
                <tr key={record.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-white font-medium">{record.name}</p>
                      <p className="text-xs text-gray-400">{record.id}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className="bg-green-900/30 text-green-200">{record.present}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className="bg-red-900/30 text-red-200">{record.absent}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className="bg-yellow-900/30 text-yellow-200">{record.late}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={getAttendanceColor(record.rate)}>
                      {record.rate}%
                    </Badge>
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
