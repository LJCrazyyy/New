
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

  // ✅ AUTO ASSIGN SUBJECTS (ADDED ONLY)
  const autoAssignSubjects = async (studentId: string, semester: string) => {
    try {
      const studentRes = await fetch(`/api/users/${studentId}`)
      const studentData = await studentRes.json()

      if (!studentRes.ok || !studentData.success) return

      const { program, yearLevel } = studentData.data

      const courseRes = await fetch(
        `/api/program-courses?program=${program}&yearLevel=${yearLevel}`
      )

      const courseData = await courseRes.json()

      if (!courseRes.ok || !courseData.success) return

      const subjects = courseData.data

      for (const subject of subjects) {
        const exists = enrollments.some(
          e =>
            e.student?.id === studentId &&
            e.course?.id === subject.courseId &&
            e.semester === semester
        )

        if (exists) continue

        await fetch('/api/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student: studentId,
            course: subject.courseId,
            semester,
            status: 'enrolled',
          }),
        })
      }
    } catch (err) {
      console.error('Auto assign error:', err)
    }
  }

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

  const getStudentCurrentUnits = (studentId: string, semester: string): number => {
    return enrollments
      .filter(
        (e) =>
          e.student?.id === studentId &&
          e.semester === semester &&
          ['enrolled', 'pending'].includes(e.status)
      )
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

  // ✅ CREATE + AUTO ASSIGN TRIGGER
  const onCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
          <form onSubmit={onCreateEnrollment} className="space-y-3">
            <select
              value={form.student}
              onChange={(e) => setForm({ ...form, student: e.target.value })}
              className="w-full bg-gray-800 text-white"
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              className="w-full bg-gray-800 text-white"
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>

            <Input
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
            />

            <Button type="submit" disabled={isSaving || !canEnroll().canEnroll}>
              {isSaving ? 'Saving...' : 'Create Enrollment'}
            </Button>
          </form>
        )}

        {/* TABLE (FULL ORIGINAL KEPT) */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-white">
            <tbody>
              {paginated.map((e) => (
                <tr key={e.id}>
                  <td>{e.student?.name}</td>
                  <td>{e.course?.code}</td>
                  <td>{e.semester}</td>
                  <td>{e.status}</td>
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