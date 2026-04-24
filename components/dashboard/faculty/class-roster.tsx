import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Download, Mail } from 'lucide-react'

interface ClassRosterProps {
  courses: Array<{
    id: string
    code: string
    name: string
    section: string
  }>
  enrollments: Array<{
    id: string
    student?: {
      id?: string
      name?: string
      email?: string
      systemId?: string
    }
    course?: {
      id?: string
      code?: string
      name?: string
      section?: string
    }
  }>
}

const PAGE_SIZE = 15

export function ClassRoster({ courses, enrollments }: ClassRosterProps) {
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id)
    }
  }, [courses, selectedCourseId])

  const rosterStudents = useMemo(() => {
    return enrollments
      .filter((enrollment) => enrollment.course?.id === selectedCourseId)
      .map((enrollment) => ({
        id: enrollment.student?.systemId ?? enrollment.student?.id ?? 'N/A',
        name: enrollment.student?.name ?? 'Unknown',
        email: enrollment.student?.email ?? 'N/A',
        year: 'N/A',
        status: 'active',
      }))
  }, [enrollments, selectedCourseId])

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return rosterStudents
    }

    return rosterStudents.filter((student) => {
      return [student.name, student.id, student.email]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [search, rosterStudents])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedStudents = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return filteredStudents.slice(start, start + PAGE_SIZE)
  }, [filteredStudents, safeCurrentPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const exportCsv = () => {
    const header = ['Student Name', 'ID', 'Email', 'Status']
    const rows = filteredStudents.map((student) => [student.name, student.id, student.email, student.status])
    const csvContent = [header, ...rows]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const selectedCourse = courses.find((course) => course.id === selectedCourseId)
    const fileName = selectedCourse ? `${selectedCourse.code}-roster.csv` : 'class-roster.csv'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Class Roster
            </CardTitle>
            <CardDescription>Total students: {filteredStudents.length}</CardDescription>
          </div>
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <select
          value={selectedCourseId}
          onChange={(event) => setSelectedCourseId(event.target.value)}
          className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white"
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name} ({course.section})
            </option>
          ))}
        </select>

        <Input
          placeholder="Search student name or ID..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
        />

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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Student Name</th>
                <th className="text-left py-3 px-4 text-gray-400">ID</th>
                <th className="text-left py-3 px-4 text-gray-400">Email</th>
                <th className="text-center py-3 px-4 text-gray-400">Status</th>
                <th className="text-center py-3 px-4 text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student) => (
                <tr key={`${student.id}-${student.email}`} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-medium">{student.name}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{student.id}</td>
                  <td className="py-3 px-4">
                    <a href={`mailto:${student.email}`} className="text-blue-400 hover:text-blue-300 text-xs">
                      {student.email}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className="bg-green-600/50 text-green-200">{student.status}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                      <Mail className="h-4 w-4" />
                    </Button>
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
