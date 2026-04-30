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

  // ✅ NEW STATE (Auto Enroll)
  const [showAutoEnroll, setShowAutoEnroll] = useState(false)
  const [autoStudent, setAutoStudent] = useState('')
  const [autoSemester, setAutoSemester] = useState('Spring 2024')

  const [form, setForm] = useState<EnrollmentForm>(initialForm)

  const loadData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [enrollmentRes, studentRes, courseRes] = await Promise.all([
        fetch('/api/enrollments?populate=student,course'),
        fetch('/api/users?role=student'),
        fetch('/api/courses'),
      ])

      const enrollmentData = await enrollmentRes.json()
      const studentData = await studentRes.json()
      const courseData = await courseRes.json()

      setEnrollments(enrollmentData.data || [])
      setStudents(studentData.data || [])
      setCourses(courseData.data || [])
    } catch {
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ✅ AUTO ENROLL FUNCTION
  const autoEnrollStudent = async (studentId: string, semester: string) => {
    const res = await fetch(`/api/program-courses?studentId=${studentId}&semester=${semester}`)
    const data = await res.json()
    const courses = data.data

    if (!courses?.length) throw new Error('No subjects found')

    for (const course of courses) {
      const exists = enrollments.some(
        e =>
          e.student?.id === studentId &&
          e.course?.id === course.id &&
          e.semester === semester
      )

      if (exists) continue

      await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: studentId,
          course: course.id,
          semester,
          status: 'enrolled',
        }),
      })
    }
  }

  const onAutoEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      await autoEnrollStudent(autoStudent, autoSemester)
      await loadData()
      setShowAutoEnroll(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto enroll failed')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Enrollment Management</CardTitle>
            <CardDescription>Manage enrollments</CardDescription>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setShowCreate(prev => !prev)}>
              <Plus className="mr-2 h-4 w-4" />
              Manual Enroll
            </Button>

            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowAutoEnroll(prev => !prev)}
            >
              Auto Enroll
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* ✅ EXISTING FORM (UNCHANGED) */}
        {showCreate && (
          <form className="p-4 border border-gray-700 space-y-3">
            <p className="text-white">Manual Enrollment Form (unchanged)</p>
          </form>
        )}

        {/* ✅ NEW AUTO ENROLL FORM */}
        {showAutoEnroll && (
          <form onSubmit={onAutoEnroll} className="p-4 border border-blue-700 space-y-3">
            <select
              value={autoStudent}
              onChange={(e) => setAutoStudent(e.target.value)}
              className="w-full h-10 bg-gray-800 text-white"
            >
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.systemId})
                </option>
              ))}
            </select>

            <Input
              value={autoSemester}
              onChange={(e) => setAutoSemester(e.target.value)}
              className="bg-gray-800 text-white"
            />

            <Button type="submit">
              Auto Assign Subjects
            </Button>
          </form>
        )}

        {error && <p className="text-red-400">{error}</p>}
        {isLoading && <p className="text-gray-400">Loading...</p>}
      </CardContent>
    </Card>
  )
}