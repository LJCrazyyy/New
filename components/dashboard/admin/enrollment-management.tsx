
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Edit, Plus, Save, X, XCircle } from 'lucide-react'

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
  prelim: string
  midterm: string
  final: string
  average: string
  gradeLetter: string
}

const initialForm: EnrollmentForm = {
  student: '',
  course: '',
  semester: 'Spring 2024',
  status: 'pending',
  prelim: '',
  midterm: '',
  final: '',
  average: '',
  gradeLetter: '',
}

const API_PAGE_LIMIT = 100
const TABLE_PAGE_SIZE = 25

async function createEnrollmentNotification(
  studentId: string | undefined,
  courseCode: string | undefined,
  status: EnrollmentRecord['status']
) {
  if (!studentId) return

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
  } catch {}
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
      page++
    }

    return aggregated
  }

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [enrollmentData, studentData, courseData] = await Promise.all([
        fetchAllPages<EnrollmentRecord>((page) =>
          `/api/enrollments?populate=student,course&limit=${API_PAGE_LIMIT}&page=${page}&sort=createdAt&order=desc`
        ),
        fetchAllPages<StudentOption>((page) =>
          `/api/users?role=student&limit=${API_PAGE_LIMIT}&page=${page}&sort=name&order=asc`
        ),
        fetchAllPages<CourseOption>((page) =>
          `/api/courses?limit=${API_PAGE_LIMIT}&page=${page}&sort=code&order=asc`
        ),
      ])

      setEnrollments(enrollmentData)
      setStudents(studentData)
      setCourses(courseData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load enrollment data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getStudentCurrentUnits = (studentId: string, semester: string, excludeEnrollmentId?: string): number => {
    return enrollments
      .filter((e) => e.student?.id === studentId && e.semester === semester && ['enrolled', 'pending'].includes(e.status))
      .reduce((sum, e) => {
        const courseData = courses.find((c) => c.id === e.course?.id)
        return sum + (courseData?.units ?? 0)
      }, 0)
  }

  const getSelectedCourseUnits = (): number => {
    const selected = courses.find((c) => c.id === form.course)
    return selected?.units ?? 0
  }

  const canEnroll = (): { canEnroll: boolean; message?: string } => {
    if (!form.student || !form.course || !form.semester) return { canEnroll: false }

    const total = getStudentCurrentUnits(form.student, form.semester) + getSelectedCourseUnits()

    if (total > 21) {
      return {
        canEnroll: false,
        message: `Cannot enroll: exceeds 21 unit limit (${total})`,
      }
    }

    return { canEnroll: true }
  }

  const onStartEdit = (enrollment: EnrollmentRecord) => {
    setEditingId(enrollment.id)
    setEditingEnrollment(enrollment)
    setEditForm({
      student: enrollment.student?.id ?? '',
      course: enrollment.course?.id ?? '',
      semester: enrollment.semester ?? '',
      status: enrollment.status,
      prelim: typeof enrollment.prelim === 'number' ? String(enrollment.prelim) : '',
      midterm: typeof enrollment.midterm === 'number' ? String(enrollment.midterm) : '',
      final: typeof enrollment.final === 'number' ? String(enrollment.final) : '',
      average: typeof enrollment.average === 'number' ? String(enrollment.average) : '',
      gradeLetter: enrollment.gradeLetter ?? '',
    })
  }

  const onCancelEdit = () => {
    setEditingId(null)
    setEditingEnrollment(null)
    setEditForm(initialForm)
  }

  const onSaveEdit = async () => {
    if (!editingId) {
      return
    }

    if (!editForm.student || !editForm.course || !editForm.semester) {
      setError('Please select student, course, and semester.')
      return
    }

    const editCurrentUnits = getStudentCurrentUnits(editForm.student, editForm.semester, editingId ?? undefined)
    const selectedCourseUnits = courses.find((course) => course.id === editForm.course)?.units ?? 0
    if (editCurrentUnits + selectedCourseUnits > 21) {
      setError(`Cannot save: student would have ${editCurrentUnits + selectedCourseUnits} units (limit is 21).`)
      return
    }

    setError('')
    setIsSaving(true)

    try {
      const response = await fetch(`/api/enrollments/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: editForm.student,
          course: editForm.course,
          semester: editForm.semester,
          status: editForm.status,
          prelim: editForm.prelim.trim() ? Number(editForm.prelim) : null,
          midterm: editForm.midterm.trim() ? Number(editForm.midterm) : null,
          final: editForm.final.trim() ? Number(editForm.final) : null,
          average: editForm.average.trim() ? Number(editForm.average) : null,
          gradeLetter: editForm.gradeLetter.trim() || null,
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update enrollment.')
      }

      onCancelEdit()
      await loadData()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update enrollment.')
    } finally {
      setIsSaving(false)
    }
  }

  // ✅ CREATE + AUTO ASSIGN TRIGGER
  const onCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: form.student,
          course: form.course,
          semester: form.semester,
          status: form.status,
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to create enrollment.')
      }

      // 🔥 AUTO ASSIGN HERE
      await autoAssignSubjects(form.student, form.semester)

      setForm(initialForm)
      setShowCreate(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredEnrollments = useMemo(() => {
    const term = search.toLowerCase()

    return enrollments.filter((e) =>
      [
        e.student?.name,
        e.student?.systemId,
        e.course?.code,
        e.course?.name,
        e.semester,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)
    )
  }, [enrollments, search])

  const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / TABLE_PAGE_SIZE))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * TABLE_PAGE_SIZE
    return filteredEnrollments.slice(start, start + TABLE_PAGE_SIZE)
  }, [filteredEnrollments, currentPage])

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-white">Enrollment Management</CardTitle>
            <CardDescription>Manage student enrollments</CardDescription>
          </div>

          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-4 h-4 mr-2" />
            New Enrollment
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

        {editingId && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Edit Enrollment</p>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={onSaveEdit} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" size="sm" variant="outline" className="border-gray-700 text-gray-200 hover:bg-gray-700" onClick={onCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <select value={editForm.student} onChange={(e) => setEditForm((p) => ({ ...p, student: e.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.name} ({student.systemId})</option>
                ))}
              </select>
              <select value={editForm.course} onChange={(e) => setEditForm((p) => ({ ...p, course: e.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.code} - {course.name} ({course.section}) - {course.units || 0} units</option>
                ))}
              </select>
              <Input value={editForm.semester} onChange={(e) => setEditForm((p) => ({ ...p, semester: e.target.value }))} placeholder="Semester" className="bg-gray-800 border-gray-700 text-white" />
              <select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as EnrollmentForm['status'] }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
                <option value="pending">Pending</option>
                <option value="enrolled">Enrolled</option>
                <option value="completed">Completed</option>
                <option value="dropped">Dropped</option>
              </select>
              <Input value={editForm.prelim} onChange={(e) => setEditForm((p) => ({ ...p, prelim: e.target.value }))} type="number" step="0.1" min="0" max="100" placeholder="Prelim" className="bg-gray-800 border-gray-700 text-white" />
              <Input value={editForm.midterm} onChange={(e) => setEditForm((p) => ({ ...p, midterm: e.target.value }))} type="number" step="0.1" min="0" max="100" placeholder="Midterm" className="bg-gray-800 border-gray-700 text-white" />
              <Input value={editForm.final} onChange={(e) => setEditForm((p) => ({ ...p, final: e.target.value }))} type="number" step="0.1" min="0" max="100" placeholder="Final" className="bg-gray-800 border-gray-700 text-white" />
              <Input value={editForm.average} onChange={(e) => setEditForm((p) => ({ ...p, average: e.target.value }))} type="number" step="0.1" min="0" max="100" placeholder="Average" className="bg-gray-800 border-gray-700 text-white" />
              <Input value={editForm.gradeLetter} onChange={(e) => setEditForm((p) => ({ ...p, gradeLetter: e.target.value }))} placeholder="Grade Letter" className="bg-gray-800 border-gray-700 text-white" />
            </div>
          </div>
        )}

        {/* TABLE (FULL ORIGINAL KEPT) */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-white">
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

        {error && <p className="text-red-400">{error}</p>}
      </CardContent>
    </Card>
  )
}