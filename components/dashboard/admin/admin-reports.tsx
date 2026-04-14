import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, FileText } from 'lucide-react'

export function AdminReports() {
  const courseEnrollmentData = [
    { course: 'CS101', enrolled: 45, capacity: 50 },
    { course: 'CS301', enrolled: 32, capacity: 40 },
    { course: 'CS401', enrolled: 28, capacity: 35 },
    { course: 'MATH101', enrolled: 52, capacity: 55 },
    { course: 'ENG101', enrolled: 35, capacity: 40 }
  ]

  const degreeDistributionData = [
    { name: 'Bachelor', value: 800, color: '#3B82F6' },
    { name: 'Master', value: 300, color: '#8B5CF6' },
    { name: 'PhD', value: 150, color: '#10B981' }
  ]

  const reports = [
    { name: 'Student Enrollment Report', description: 'Complete enrollment statistics by semester', date: '2024-04-10' },
    { name: 'Faculty Performance Report', description: 'Teaching effectiveness and student satisfaction', date: '2024-04-09' },
    { name: 'Academic Progress Report', description: 'Student GPA distribution and academic standing', date: '2024-04-08' },
    { name: 'Financial Summary', description: 'Tuition revenue and expenses summary', date: '2024-04-07' }
  ]

  return (
    <div className="space-y-6">
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Enrollment */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Course Enrollment</CardTitle>
            <CardDescription>Current enrollment vs capacity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseEnrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="course" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                <Legend />
                <Bar dataKey="enrolled" fill="#3B82F6" />
                <Bar dataKey="capacity" fill="#6B7280" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Degree Distribution */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Degree Distribution</CardTitle>
            <CardDescription>Student distribution by degree level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={degreeDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {degreeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Available Reports</CardTitle>
          <CardDescription>Download system reports and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report, idx) => (
              <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-between hover:border-gray-600 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-900/30 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{report.name}</p>
                    <p className="text-gray-400 text-xs">{report.description}</p>
                    <p className="text-gray-500 text-xs mt-1">Generated: {report.date}</p>
                  </div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
