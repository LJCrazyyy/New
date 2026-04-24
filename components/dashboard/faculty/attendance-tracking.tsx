import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckSquare, Save, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface AttendanceTrackingProps {
  facultyId: string
  courses: Array<{
    id: string
    code: string
    name: string
    semester: string
  }>
  enrollments: Array<{
    id: string
    student?: {
      id?: string
      name?: string
      systemId?: string
    }
    course?: {
      id?: string
      code?: string
      semester?: string
    }
  }>
}

const PAGE_SIZE = 12

type AttendanceRecord = {
  id: string
  totalSessions: number
  sessionAttended: number
  attendancePercentage: number
  semester: string
  student?: {
    id?: string
    name?: string
    systemId?: string
  }
  course?: {
    id?: string
    code?: string
  }
}

export function AttendanceTracking({ facultyId, courses, enrollments }: AttendanceTrackingProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [totalSessions, setTotalSessions] = useState('0')
  const [sessionAttended, setSessionAttended] = useState('0')
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id)
    }
  }, [courses, selectedCourseId])

  useEffect(() => {
    const filtered = enrollments.filter((enrollment) => enrollment.course?.id === selectedCourseId)
    setSelectedEnrollmentId(filtered[0]?.id ?? '')
  }, [enrollments, selectedCourseId])

  const loadAttendance = async () => {
    const course = courses.find((item) => item.id === selectedCourseId)
    if (!course) {
      setRecords([])
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/attendance?course=${course.id}&semester=${encodeURIComponent(course.semester)}&populate=student,course&sort=lastUpdated&order=desc&limit=200`)
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load attendance records.')
      }

      setRecords(Array.isArray(payload.data) ? payload.data : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load attendance records.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAttendance()
  }, [selectedCourseId])

  const eligibleEnrollments = useMemo(() => {
    if (!selectedCourseId) {
      return []
    }

    return enrollments.filter((enrollment) => enrollment.course?.id === selectedCourseId)
  }, [enrollments, selectedCourseId])

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedAttendance = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return records.slice(start, start + PAGE_SIZE)
  }, [records, safeCurrentPage])

  const selectedCourse = courses.find((course) => course.id === selectedCourseId)

  const createAttendance = async () => {
    const enrollment = eligibleEnrollments.find((item) => item.id === selectedEnrollmentId)
    if (!enrollment?.student?.id || !selectedCourse) {
      setError('Select a valid student and course.')
      return
    }

    const total = Number(totalSessions)
    const attended = Number(sessionAttended)

    if (!Number.isFinite(total) || !Number.isFinite(attended) || total < 0 || attended < 0 || attended > total) {
      setError('Invalid attendance values. Ensure attended is not greater than total sessions.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: enrollment.student.id,
          course: selectedCourse.id,
          semester: selectedCourse.semester,
          totalSessions: total,
          sessionAttended: attended,
          attendancePercentage: total > 0 ? Number(((attended / total) * 100).toFixed(2)) : 0,
          lastUpdated: new Date().toISOString(),
          updatedBy: facultyId,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create attendance record.')
      }

      setTotalSessions('0')
      setSessionAttended('0')
      await loadAttendance()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create attendance record.')
    } finally {
      setIsSaving(false)
    }
  }

  const updateRecord = async (record: AttendanceRecord, nextTotal: number, nextAttended: number) => {
    const response = await fetch(`/api/attendance/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalSessions: nextTotal,
        sessionAttended: nextAttended,
        attendancePercentage: nextTotal > 0 ? Number(((nextAttended / nextTotal) * 100).toFixed(2)) : 0,
        lastUpdated: new Date().toISOString(),
      }),
    })

    const payload = await response.json()
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Failed to update attendance record.')
    }
  }

  const onQuickAdjust = async (record: AttendanceRecord, mode: 'present' | 'absent') => {
    try {
      setError('')
      const nextTotal = record.totalSessions + 1
      const nextAttended = mode === 'present' ? record.sessionAttended + 1 : record.sessionAttended
      await updateRecord(record, nextTotal, nextAttended)
      await loadAttendance()
    } catch (adjustError) {
      setError(adjustError instanceof Error ? adjustError.message : 'Failed to update attendance record.')
    }
  }

  const deleteRecord = async (id: string) => {
    const confirmed = window.confirm('Delete this attendance record?')
    if (!confirmed) {
      return
    }

    try {
      setError('')
      const response = await fetch(`/api/attendance/${id}`, { method: 'DELETE' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete attendance record.')
      }

      setRecords((previous) => previous.filter((record) => record.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete attendance record.')
    }
  }

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
            <CardDescription>Create, update, and monitor attendance per class</CardDescription>
          </div>
          <select
            value={selectedCourseId}
            onChange={(event) => setSelectedCourseId(event.target.value)}
            className="h-9 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <select
            value={selectedEnrollmentId}
            onChange={(event) => setSelectedEnrollmentId(event.target.value)}
            className="md:col-span-2 h-10 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
          >
            {eligibleEnrollments.map((enrollment) => (
              <option key={enrollment.id} value={enrollment.id}>
                {(enrollment.student?.name ?? 'Unknown Student')} ({enrollment.student?.systemId ?? 'N/A'})
              </option>
            ))}
          </select>
          <Input
            type="number"
            value={totalSessions}
            onChange={(event) => setTotalSessions(event.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
            placeholder="Total sessions"
          />
          <Input
            type="number"
            value={sessionAttended}
            onChange={(event) => setSessionAttended(event.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
            placeholder="Attended"
          />
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={createAttendance} disabled={isSaving || !selectedCourse || !selectedEnrollmentId}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading attendance records...</p>}

        <div className="mb-4 flex items-center justify-between text-sm text-gray-400">
          <p>
            Page {safeCurrentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Student</th>
                <th className="text-center py-3 px-4 text-gray-400">Total</th>
                <th className="text-center py-3 px-4 text-gray-400">Attended</th>
                <th className="text-center py-3 px-4 text-gray-400">Missed</th>
                <th className="text-center py-3 px-4 text-gray-400">Rate</th>
                <th className="text-center py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAttendance.map((record) => (
                <tr key={record.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-white font-medium">{record.student?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{record.student?.systemId ?? 'N/A'}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className="bg-blue-900/30 text-blue-200">{record.totalSessions}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className="bg-green-900/30 text-green-200">{record.sessionAttended}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className="bg-red-900/30 text-red-200">{Math.max(0, record.totalSessions - record.sessionAttended)}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={getAttendanceColor(record.attendancePercentage)}>
                      {record.attendancePercentage.toFixed(2)}%
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" variant="outline" className="border-green-700 text-green-300" onClick={() => onQuickAdjust(record, 'present')}>
                        +Present
                      </Button>
                      <Button size="sm" variant="outline" className="border-yellow-700 text-yellow-300" onClick={() => onQuickAdjust(record, 'absent')}>
                        +Absent
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-700 text-red-300" onClick={() => deleteRecord(record.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
