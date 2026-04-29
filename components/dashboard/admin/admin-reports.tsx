'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, FileText } from 'lucide-react'

type UserRecord = {
  role: 'student' | 'faculty' | 'admin'
}

type CourseRecord = {
  code: string
  enrolledCount: number
  capacity: number
}

type EnrollmentRecord = {
  status: 'enrolled' | 'completed' | 'dropped' | 'pending'
}

const MAX_STUDENTS_PER_COURSE = 50

function normalizeCourseValue(value: number) {
  return Math.min(Math.max(Number(value ?? 0), 0), MAX_STUDENTS_PER_COURSE)
}

export function AdminReports() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [courses, setCourses] = useState<CourseRecord[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadData() {
      setIsLoading(true)
      setError('')

      try {
        const [usersResponse, coursesResponse, enrollmentsResponse] = await Promise.all([
          fetch('/api/users?limit=2000'),
          fetch('/api/courses?limit=1000&sort=code&order=asc'),
          fetch('/api/enrollments?limit=2000'),
        ])

        const usersPayload = await usersResponse.json()
        const coursesPayload = await coursesResponse.json()
        const enrollmentsPayload = await enrollmentsResponse.json()

        if (!usersResponse.ok || !usersPayload.success) {
          throw new Error(usersPayload.message || 'Failed to load users report data.')
        }
        if (!coursesResponse.ok || !coursesPayload.success) {
          throw new Error(coursesPayload.message || 'Failed to load courses report data.')
        }
        if (!enrollmentsResponse.ok || !enrollmentsPayload.success) {
          throw new Error(enrollmentsPayload.message || 'Failed to load enrollments report data.')
        }

        if (mounted) {
          setUsers(Array.isArray(usersPayload.data) ? usersPayload.data : [])
          setCourses(Array.isArray(coursesPayload.data) ? coursesPayload.data : [])
          setEnrollments(Array.isArray(enrollmentsPayload.data) ? enrollmentsPayload.data : [])
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load report data.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [])

  const courseEnrollmentData = useMemo(() => {
    return courses.slice(0, 8).map((course) => ({
      course: course.code,
      enrolled: normalizeCourseValue(course.enrolledCount ?? 0),
      capacity: normalizeCourseValue(course.capacity ?? 0),
    }))
  }, [courses])

  const degreeDistributionData = useMemo(() => {
    const studentCount = users.filter((user) => user.role === 'student').length
    const facultyCount = users.filter((user) => user.role === 'faculty').length
    const adminCount = users.filter((user) => user.role === 'admin').length

    return [
      { name: 'Students', value: studentCount, color: '#3B82F6' },
      { name: 'Faculty', value: facultyCount, color: '#8B5CF6' },
      { name: 'Admins', value: adminCount, color: '#10B981' },
    ]
  }, [users])

  const reports = useMemo(() => {
    const totalEnrollments = enrollments.length
    const pendingEnrollments = enrollments.filter((enrollment) => enrollment.status === 'pending').length
    const droppedEnrollments = enrollments.filter((enrollment) => enrollment.status === 'dropped').length
    const completionRate = totalEnrollments === 0
      ? 0
      : Math.round((enrollments.filter((enrollment) => enrollment.status === 'completed').length / totalEnrollments) * 100)

    return [
      {
        name: 'Enrollment Summary',
        description: `Total ${totalEnrollments} enrollments with ${pendingEnrollments} pending review.`,
        date: new Date().toLocaleDateString(),
      },
      {
        name: 'Course Capacity Snapshot',
        description: `${courses.length} active courses tracked in the system.`,
        date: new Date().toLocaleDateString(),
      },
      {
        name: 'Student Lifecycle',
        description: `${droppedEnrollments} dropped enrollments and ${completionRate}% completion rate.`,
        date: new Date().toLocaleDateString(),
      },
      {
        name: 'User Distribution',
        description: `${users.length} total accounts across students, faculty, and admins.`,
        date: new Date().toLocaleDateString(),
      },
    ]
  }, [courses, enrollments, users])

  return (
    <div className="space-y-6">
      {isLoading && <p className="text-sm text-gray-400">Loading reports...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

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

        {/* User Distribution */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">User Distribution</CardTitle>
            <CardDescription>Account distribution by role</CardDescription>
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
          <CardDescription>Live-generated analytics summaries</CardDescription>
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
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.print()}>
                  <Download className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
