'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Plus, XCircle } from 'lucide-react'

type EnrollmentRecord = {
  id: string
  semester: string
  status: 'enrolled' | 'completed' | 'dropped' | 'pending'
  prelim?: number | null
  midterm?: number | null
  final?: number | null
  average?: number | null
  gradeLetter?: string | null
  createdAt?: string
  student?: {
    id?: string
    name?: string
    systemId?: string
  }
  course?: {
    id?: string
    code?: string
    name?: string
    section?: string
  }
}

type StudentOption = {
  id: string
  name: string
  systemId: string
}

type CourseOption = {
  id: string
  code: string
  name: string
  section: string
  units?: number
}

type EnrollmentForm = {
  student: string
  course: string
  semester: string
  status: 'enrolled' | 'completed' | 'dropped' | 'pending'
}

const initialForm: EnrollmentForm = {
  student: '',
  course: '',
  semester: 'Spring 2024',
  status: 'pending',
}

const API_PAGE_LIMIT = 100
const TABLE_PAGE_SIZE = 25

async function createEnrollmentNotification(
  studentId: string | undefined,
  courseCode: string | undefined,
  status: EnrollmentRecord['status']
) {
  if (!studentId) {
    return
  }

  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)

  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: studentId,
        recipientRole: 'student',
        type: 'enrollment',
        title: 'Enrollment update',
        message: `Your enrollment for ${courseCode ?? 'a course'} is now ${statusLabel}.`,
        link: '/dashboard/student/courses',
      }),
    })
  } catch {
    return
  }
}

export function EnrollmentManagement() {
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<EnrollmentForm>(initialForm)

  const fetchAllPages = async <T,>(urlForPage: (page: number) => string): Promise<T[]> => {
    const aggregated: T[] = []
    let page = 1
    let totalPages = 1

    while (page <= totalPages) {
      const response = await fetch(urlForPage(page))
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load data.')
      }

      aggregated.push(...((Array.isArray(payload.data) ? payload.data : []) as T[]))

      const pagesFromMeta = Number(payload?.meta?.pagination?.pages)
      totalPages = Number.isFinite(pagesFromMeta) && pagesFromMeta > 0 ? pagesFromMeta : 1
      page += 1
    }

    return aggregated
  }

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [enrollmentData, studentData, courseData] = await Promise.all([
        fetchAllPages<EnrollmentRecord>((page) => `/api/enrollments?populate=student,course&limit=${API_PAGE_LIMIT}&page=${page}&sort=createdAt&order=desc`),
        fetchAllPages<{ id: string; name: string; systemId: string }>((page) => `/api/users?role=student&limit=${API_PAGE_LIMIT}&page=${page}&sort=name&order=asc`),
        fetchAllPages<CourseOption>((page) => `/api/courses?limit=${API_PAGE_LIMIT}&page=${page}&sort=code&order=asc`),
      ])

      setEnrollments(enrollmentData)
      setStudents(studentData.map((student) => ({ id: student.id, name: student.name, systemId: student.systemId })))
      setCourses(courseData.map((course) => ({ id: course.id, code: course.code, name: course.name, section: course.section, units: (course as any).units })))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load enrollment data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredEnrollments = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return enrollments

    return enrollments.filter((enrollment) => {
      return [
        enrollment.student?.name,
        enrollment.student?.systemId,
        enrollment.course?.code,
        enrollment.course?.name,
        enrollment.semester,
        enrollment.status,
        enrollment.gradeLetter,
        enrollment.average,
      ].some((value) => String(value ?? '').toLowerCase().includes(term))
    })
  }, [enrollments, search])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / TABLE_PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedEnrollments = useMemo(() => {
    const start = (safeCurrentPage - 1) * TABLE_PAGE_SIZE
    return filteredEnrollments.slice(start, start + TABLE_PAGE_SIZE)
  }, [filteredEnrollments, safeCurrentPage])

  const getStatusColor = (status: EnrollmentRecord['status']) => {
    switch (status) {
      case 'enrolled':
      case 'completed':
        return 'bg-green-900/30 text-green-200 border-green-700'
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-200 border-yellow-700'
      case 'dropped':
        return 'bg-red-900/30 text-red-200 border-red-700'
      default:
        return 'bg-gray-700/30 text-gray-200'
    }
  }

  const getStatusIcon = (status: EnrollmentRecord['status']) => {
    switch (status) {
      case 'enrolled':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'dropped':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStudentCurrentUnits = (studentId: string, semester: string): number => {
    return enrollments
      .filter((e) => e.student?.id === studentId && e.semester === semester && ['enrolled', 'pending'].includes(e.status))
      .reduce((sum, e) => {
        const courseData = courses.find((c) => c.id === e.course?.id)
        return sum + (courseData?.units ?? 0)
      }, 0)
  }

  const getSelectedCourseUnits = (): number => {
    const selectedCourse = courses.find((c) => c.id === form.course)
    return selectedCourse?.units ?? 0
  }

  const canEnroll = (): { canEnroll: boolean; message?: string } => {
    if (!form.student || !form.course || !form.semester) {
      return { canEnroll: false }
    }

    const currentUnits = getStudentCurrentUnits(form.student, form.semester)
    const courseUnits = getSelectedCourseUnits()
    const totalWouldBe = currentUnits + courseUnits
    const MAX_UNITS = 21

    if (totalWouldBe > MAX_UNITS) {
      return {
        canEnroll: false,
        message: `Cannot enroll: student would have ${totalWouldBe} units (limit is ${MAX_UNITS})`,
      }
    }

    return { canEnroll: true }
  }

  const onCreateEnrollment = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!form.student || !form.course || !form.semester) {
      setError('Please select student, course, and semester.')
      return
    }

    const { canEnroll: isAllowed, message } = canEnroll()
    if (!isAllowed) {
      setError(message || 'Cannot enroll student.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: form.student,
          course: form.course,
          semester: form.semester,
          status: form.status,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create enrollment.')
      }

      setForm(initialForm)
      setShowCreate(false)
      await loadData()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create enrollment.')
    } finally {
      setIsSaving(false)
    }
  }

  const onUpdateStatus = async (id: string, status: EnrollmentRecord['status']) => {
    setError('')

    try {
      const targetEnrollment = enrollments.find((enrollment) => enrollment.id === id)
      const response = await fetch(`/api/enrollments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update enrollment status.')
      }

      await createEnrollmentNotification(targetEnrollment?.student?.id, targetEnrollment?.course?.code, status)

      await loadData()
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Failed to update enrollment status.')
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
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowCreate((prev) => !prev)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreate ? 'Close' : 'New Enrollment'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreate && (
          <form className="gap-3 rounded-lg border border-gray-700 bg-gray-800/40 p-4 space-y-3" onSubmit={onCreateEnrollment}>
            <div className="grid gap-3 md:grid-cols-4">
              <select value={form.student} onChange={(e) => setForm((p) => ({ ...p, student: e.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.name} ({student.systemId})</option>
                ))}
              </select>
              <select value={form.course} onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.code} - {course.name} ({course.section}) - {course.units || 0} units</option>
                ))}
              </select>
              <Input value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))} placeholder="Semester" className="bg-gray-800 border-gray-700 text-white" />
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as EnrollmentForm['status'] }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
                <option value="pending">Pending</option>
                <option value="enrolled">Enrolled</option>
                <option value="completed">Completed</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>

            {/* Unit Information Display */}
            {form.student && form.course && form.semester && (
              <div className="p-3 rounded-md bg-gray-700/30 border border-gray-600">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-300">Current Units: <span className="font-semibold text-blue-400">{getStudentCurrentUnits(form.student, form.semester)}</span></p>
                    <p className="text-gray-300">Course Units: <span className="font-semibold text-green-400">{getSelectedCourseUnits()}</span></p>
                    <p className="text-gray-300">Total After Enrollment: <span className={`font-semibold ${getStudentCurrentUnits(form.student, form.semester) + getSelectedCourseUnits() > 21 ? 'text-red-400' : 'text-white'}`}>{getStudentCurrentUnits(form.student, form.semester) + getSelectedCourseUnits()}</span> / 21</p>
                  </div>
                  {getStudentCurrentUnits(form.student, form.semester) + getSelectedCourseUnits() > 21 && (
                    <div className="text-right">
                      <Badge className="bg-red-900 text-red-200 border-red-700 border">Exceeds Limit</Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving || !canEnroll().canEnroll} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? 'Saving...' : 'Create Enrollment'}</Button>
            </div>
          </form>
        )}

        <div className="relative">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search enrollments by student, course, semester..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading enrollments...</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Student Name</th>
                <th className="text-left py-3 px-4 text-gray-400">Course</th>
                <th className="text-center py-3 px-4 text-gray-400">Prelim</th>
                <th className="text-center py-3 px-4 text-gray-400">Midterm</th>
                <th className="text-center py-3 px-4 text-gray-400">Final</th>
                <th className="text-center py-3 px-4 text-gray-400">Average</th>
                <th className="text-center py-3 px-4 text-gray-400">Grade</th>
                <th className="text-center py-3 px-4 text-gray-400">Status</th>
                <th className="text-center py-3 px-4 text-gray-400">Semester</th>
                <th className="text-center py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEnrollments.map((enroll) => (
                <tr key={enroll.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-medium">
                    {enroll.student?.name ?? 'Unknown'}
                    <p className="text-xs text-gray-500">{enroll.student?.systemId ?? 'N/A'}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-400">
                    {enroll.course?.code ?? '-'}
                    <p className="text-xs text-gray-500">{enroll.course?.name ?? '-'}</p>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-300">{typeof enroll.prelim === 'number' ? enroll.prelim.toFixed(1) : '-'}</td>
                  <td className="py-3 px-4 text-center text-gray-300">{typeof enroll.midterm === 'number' ? enroll.midterm.toFixed(1) : '-'}</td>
                  <td className="py-3 px-4 text-center text-gray-300">{typeof enroll.final === 'number' ? enroll.final.toFixed(1) : '-'}</td>
                  <td className="py-3 px-4 text-center text-gray-300">{typeof enroll.average === 'number' ? enroll.average.toFixed(1) : '-'}</td>
                  <td className="py-3 px-4 text-center text-gray-300">{enroll.gradeLetter ?? '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Badge className={`${getStatusColor(enroll.status)} border`}>
                        {getStatusIcon(enroll.status)}
                        <span className="ml-1 uppercase">{enroll.status}</span>
                      </Badge>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-400 text-xs">{enroll.semester}</td>
                  <td className="py-3 px-4 text-center">
                    {enroll.status === 'pending' && (
                      <div className="space-x-1">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onUpdateStatus(enroll.id, 'enrolled')}>Approve</Button>
                        <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:text-red-300" onClick={() => onUpdateStatus(enroll.id, 'dropped')}>Reject</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-400">
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
      </CardContent>
    </Card>
  )
}
