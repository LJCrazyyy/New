import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Save } from 'lucide-react'

type CourseOption = {
  id: string
  code: string
  name: string
  section: string
}

type EnrollmentRow = {
  id: string
  prelim: number | null
  midterm: number | null
  final: number | null
  average: number | null
  student?: {
    id?: string
    systemId?: string
    name?: string
  }
  course?: {
    id?: string
    code?: string
    name?: string
    section?: string
  }
}

type GradeEntryProps = {
  courses: CourseOption[]
  enrollments: EnrollmentRow[]
  onRefresh?: () => Promise<void> | void
}

type DraftGrades = Record<
  string,
  {
    prelim: string
    midterm: string
    final: string
  }
>

type GradeScaleEntry = {
  id: string
  letterGrade: string
  minScore: number
  maxScore: number
}

const PAGE_SIZE = 20

function toInputValue(value: number | null | undefined) {
  return value == null ? '' : String(value)
}

function toNullableNumber(value: string) {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function calculateAverage(prelim: number | null, midterm: number | null, final: number | null) {
  const values = [prelim, midterm, final].filter((value): value is number => value != null)

  if (values.length === 0) {
    return null
  }

  const sum = values.reduce((accumulator, value) => accumulator + value, 0)
  return Number((sum / values.length).toFixed(1))
}

function toGradeLetter(average: number | null, gradeScales: GradeScaleEntry[]) {
  if (average == null) return null

  if (gradeScales.length > 0) {
    const matchedScale = gradeScales.find((scale) => average >= scale.minScore && average <= scale.maxScore)
    if (matchedScale) {
      return matchedScale.letterGrade
    }
  }

  if (average >= 90) return 'A'
  if (average >= 80) return 'B'
  if (average >= 70) return 'C'
  if (average >= 60) return 'D'
  return 'F'
}

async function createGradeNotification(
  studentId: string | undefined,
  courseCode: string | undefined,
  average: number | null
) {
  if (!studentId) {
    return
  }

  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: studentId,
        recipientRole: 'student',
        type: 'academic',
        title: 'Grade updated',
        message: `Your grades for ${courseCode ?? 'a course'} were updated. Average: ${average == null ? 'N/A' : average.toFixed(1)}.`,
        link: '/dashboard/student/grades',
      }),
    })
  } catch {
    return
  }
}

export function GradeEntry({ courses, enrollments, onRefresh }: GradeEntryProps) {
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [drafts, setDrafts] = useState<DraftGrades>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [gradeScales, setGradeScales] = useState<GradeScaleEntry[]>([])

  useEffect(() => {
    let mounted = true

    async function loadGradeScales() {
      try {
        const response = await fetch('/api/grade-scales?sort=maxScore&order=desc&limit=100')
        const payload = await response.json()

        if (!response.ok || !payload.success) {
          return
        }

        if (mounted) {
          setGradeScales(
            (Array.isArray(payload.data) ? payload.data : [])
              .filter((entry: any) => typeof entry?.minScore === 'number' && typeof entry?.maxScore === 'number')
              .map((entry: any) => ({
                id: entry.id,
                letterGrade: String(entry.letterGrade ?? '').toUpperCase(),
                minScore: Number(entry.minScore),
                maxScore: Number(entry.maxScore),
              }))
          )
        }
      } catch {
        return
      }
    }

    loadGradeScales()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id)
    }
  }, [courses, selectedCourseId])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCourseId])

  const filteredEnrollments = useMemo(() => {
    if (!selectedCourseId) {
      return enrollments
    }

    return enrollments.filter((enrollment) => enrollment.course?.id === selectedCourseId)
  }, [enrollments, selectedCourseId])

  const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedEnrollments = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return filteredEnrollments.slice(start, start + PAGE_SIZE)
  }, [filteredEnrollments, safeCurrentPage])

  const getDraftValue = (enrollment: EnrollmentRow, field: 'prelim' | 'midterm' | 'final') => {
    return drafts[enrollment.id]?.[field] ?? toInputValue(enrollment[field])
  }

  const setDraftValue = (enrollmentId: string, field: 'prelim' | 'midterm' | 'final', value: string) => {
    setDrafts((previous) => ({
      ...previous,
      [enrollmentId]: {
        prelim: previous[enrollmentId]?.prelim ?? '',
        midterm: previous[enrollmentId]?.midterm ?? '',
        final: previous[enrollmentId]?.final ?? '',
        [field]: value,
      },
    }))
  }

  const saveEnrollment = async (enrollment: EnrollmentRow) => {
    const prelim = toNullableNumber(getDraftValue(enrollment, 'prelim'))
    const midterm = toNullableNumber(getDraftValue(enrollment, 'midterm'))
    const final = toNullableNumber(getDraftValue(enrollment, 'final'))
    const average = calculateAverage(prelim, midterm, final)

    const gradeLetter = toGradeLetter(average, gradeScales)

    const response = await fetch(`/api/enrollments/${enrollment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prelim,
        midterm,
        final,
        average,
        gradeLetter,
      }),
    })

    const payload = await response.json()

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Failed to save enrollment grade.')
    }

    await createGradeNotification(enrollment.student?.id, enrollment.course?.code, average)
  }

  const onSaveAll = async () => {
    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      for (const enrollment of filteredEnrollments) {
        await saveEnrollment(enrollment)
      }

      if (onRefresh) {
        await onRefresh()
      }

      setDrafts({})
      setSuccess('Grades saved successfully.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save grades.')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedCourse = courses.find((course) => course.id === selectedCourseId)

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-white">Grade Entry</CardTitle>
            <CardDescription>
              {selectedCourse
                ? `${selectedCourse.code} - ${selectedCourse.name} (Section ${selectedCourse.section})`
                : 'No course selected'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
            <Button className="bg-green-600 hover:bg-green-700" onClick={onSaveAll} disabled={isSaving || filteredEnrollments.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Grades'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}

        {filteredEnrollments.length === 0 ? (
          <p className="text-sm text-gray-400">No enrollments available for this course.</p>
        ) : (
          <div className="space-y-3">
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
                  <th className="text-left py-3 px-4 text-gray-400">Student</th>
                  <th className="text-center py-3 px-4 text-gray-400">Prelim</th>
                  <th className="text-center py-3 px-4 text-gray-400">Midterm</th>
                  <th className="text-center py-3 px-4 text-gray-400">Final</th>
                  <th className="text-center py-3 px-4 text-gray-400">Average</th>
                  <th className="text-center py-3 px-4 text-gray-400">Grade</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEnrollments.map((enrollment) => {
                  const prelim = toNullableNumber(getDraftValue(enrollment, 'prelim'))
                  const midterm = toNullableNumber(getDraftValue(enrollment, 'midterm'))
                  const final = toNullableNumber(getDraftValue(enrollment, 'final'))
                  const average = calculateAverage(prelim, midterm, final)
                  const letter = toGradeLetter(average, gradeScales)

                  return (
                    <tr key={enrollment.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium">{enrollment.student?.name ?? 'Unknown'}</p>
                          <p className="text-xs text-gray-400">{enrollment.student?.systemId ?? 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Input
                          type="number"
                          value={getDraftValue(enrollment, 'prelim')}
                          onChange={(event) => setDraftValue(enrollment.id, 'prelim', event.target.value)}
                          className="w-16 h-8 bg-gray-800 border-gray-700 text-white text-center text-xs"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Input
                          type="number"
                          value={getDraftValue(enrollment, 'midterm')}
                          onChange={(event) => setDraftValue(enrollment.id, 'midterm', event.target.value)}
                          className="w-16 h-8 bg-gray-800 border-gray-700 text-white text-center text-xs"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Input
                          type="number"
                          value={getDraftValue(enrollment, 'final')}
                          onChange={(event) => setDraftValue(enrollment.id, 'final', event.target.value)}
                          className="w-16 h-8 bg-gray-800 border-gray-700 text-white text-center text-xs"
                        />
                      </td>
                      <td className="py-3 px-4 text-center text-white font-semibold">{average == null ? '-' : average.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-blue-900/30 text-blue-200">{letter ?? '-'}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}