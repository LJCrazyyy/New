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
  student?: {
    id?: string
    name?: string
    systemId?: string
    program?: string
    yearLevel?: number
  }
  course?: {
    id?: string
    code?: string
    name?: string
    section?: string
    units?: number
  }
}

type StudentOption = {
  id: string
  name: string
  systemId: string
  program: string
  yearLevel: number
}

type EnrollmentForm = {
  student: string
  semester: string
}

const initialForm: EnrollmentForm = {
  student: '',
  semester: '1st Sem',
}

export function EnrollmentManagement() {
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(initialForm)

  // 🔁 Load data
  const loadData = async () => {
    setIsLoading(true)
    try {
      const [enrollRes, studentRes] = await Promise.all([
        fetch('/api/enrollments?populate=student,course'),
        fetch('/api/users?role=student'),
      ])

      const enrollData = await enrollRes.json()
      const studentData = await studentRes.json()

      setEnrollments(enrollData.data || [])
      setStudents(studentData.data || [])
    } catch {
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 🧠 AUTO ENROLL FUNCTION
  const autoEnrollStudent = async (studentId: string, semester: string) => {
    const student = students.find(s => s.id === studentId)
    if (!student) throw new Error('Student not found')

    // 🔥 Get subjects based on program/year
    const res = await fetch(
      `/api/program-courses?program=${student.program}&yearLevel=${student.yearLevel}&semester=${semester}`
    )

    const data = await res.json()
    const courses = data.data

    if (!courses || courses.length === 0) {
      throw new Error('No subjects found for this student')
    }

    // ✅ Unit limit check
    const totalUnits = courses.reduce(
      (sum: number, c: any) => sum + (c.units || 0),
      0
    )

    if (totalUnits > 21) {
      throw new Error(`Unit overload: ${totalUnits}/21`)
    }

    // 🚀 Create enrollments
    for (const course of courses) {
      const already = enrollments.some(
        e =>
          e.student?.id === studentId &&
          e.course?.id === course.id &&
          e.semester === semester
      )

      if (already) continue

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

  // 🎯 Submit handler
  const onAutoEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      await autoEnrollStudent(form.student, form.semester)
      await loadData()
      setShowCreate(false)
      setForm(initialForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setIsSaving(false)
    }
  }

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return enrollments.filter(e =>
      `${e.student?.name} ${e.course?.code} ${e.semester}`
        .toLowerCase()
        .includes(term)
    )
  }, [search, enrollments])

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-white">Enrollment Management</CardTitle>
            <CardDescription>Auto assign subjects to students</CardDescription>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" />
            {showCreate ? 'Close' : 'Auto Enroll'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showCreate && (
          <form onSubmit={onAutoEnroll} className="space-y-3">
            <select
              value={form.student}
              onChange={e => setForm(p => ({ ...p, student: e.target.value }))}
              className="w-full h-10 bg-gray-800 text-white"
            >
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.program} - Year {s.yearLevel})
                </option>
              ))}
            </select>

            <Input
              value={form.semester}
              onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}
              placeholder="Semester"
              className="bg-gray-800 text-white"
            />

            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Processing...' : 'Auto Enroll Subjects'}
            </Button>
          </form>
        )}

        <Input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-gray-800 text-white"
        />

        {error && <p className="text-red-400">{error}</p>}
        {isLoading && <p className="text-gray-400">Loading...</p>}

        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400">
              <th>Student</th>
              <th>Course</th>
              <th>Status</th>
              <th>Semester</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} className="border-b border-gray-800">
                <td className="text-white">{e.student?.name}</td>
                <td>{e.course?.code}</td>
                <td>
                  <Badge>{e.status}</Badge>
                </td>
                <td>{e.semester}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}