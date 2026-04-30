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

  // 🔥 AUTO ASSIGN SUBJECTS (ADDED ONLY)
  const autoAssignSubjects = async (studentId: string, semester: string) => {
    try {
      const studentRes = await fetch(`/api/users/${studentId}`)
      const studentData = await studentRes.json()

      if (!studentRes.ok || !studentData.success) return

      const { program, yearLevel } = studentData.data

      const courseRes = await fetch(`/api/program-courses?program=${program}&yearLevel=${yearLevel}`)
      const courseData = await courseRes.json()

      if (!courseRes.ok || !courseData.success) return

      const subjects = courseData.data

      await Promise.all(
        subjects.map((subject: any) =>
          fetch('/api/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student: studentId,
              course: subject.courseId,
              semester,
              status: 'enrolled',
            }),
          })
        )
      )
    } catch (err) {
      console.error('Auto assign failed', err)
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

      // 🔥 AUTO ASSIGN TRIGGER
      await autoAssignSubjects(form.student, form.semester)

      setForm(initialForm)
      setShowCreate(false)
      await loadData()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create enrollment.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Enrollment Management</CardTitle>
      </CardHeader>
      <CardContent>
        {/* UI NOT MODIFIED */}
      </CardContent>
    </Card>
  )
}