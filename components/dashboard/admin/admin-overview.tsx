import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Users, BookOpen, UserCheck, AlertCircle } from 'lucide-react'

export function AdminOverview() {
  const stats = [
    { label: 'Total Students', value: 1250, icon: Users, color: 'bg-blue-900/30 text-blue-400' },
    { label: 'Total Faculty', value: 85, icon: BookOpen, color: 'bg-purple-900/30 text-purple-400' },
    { label: 'Active Courses', value: 42, icon: UserCheck, color: 'bg-green-900/30 text-green-400' },
    { label: 'System Alerts', value: 3, icon: AlertCircle, color: 'bg-red-900/30 text-red-400' }
  ]

  const enrollmentData = [
    { month: 'Jan', students: 1100, capacity: 1500 },
    { month: 'Feb', students: 1180, capacity: 1500 },
    { month: 'Mar', students: 1220, capacity: 1500 },
    { month: 'Apr', students: 1250, capacity: 1500 }
  ]

  const performanceData = [
    { month: 'Jan', avgGPA: 2.8 },
    { month: 'Feb', avgGPA: 2.85 },
    { month: 'Mar', avgGPA: 2.92 },
    { month: 'Apr', avgGPA: 2.95 }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Enrollment Trend</CardTitle>
            <CardDescription>Student enrollment vs system capacity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                <Legend />
                <Bar dataKey="students" fill="#3B82F6" />
                <Bar dataKey="capacity" fill="#6B7280" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* GPA Trend */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Average GPA Trend</CardTitle>
            <CardDescription>System-wide academic performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                <Legend />
                <Line type="monotone" dataKey="avgGPA" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
