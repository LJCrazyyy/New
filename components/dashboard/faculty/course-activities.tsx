'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type CourseOption = {
  id: string
  code: string
  name: string
  section: string
  semester: string
}

type EnrollmentOption = {
  id: string
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

type ActivityRecord = {
  id: string
  title: string
  description?: string
  type: 'assignment' | 'quiz' | 'task' | 'lecture'
  dueDate?: string
  points: number
  contentUrl?: string
  status: string
}

type SubmissionRecord = {
  id: string
  score: number | null
  feedback?: string
  status: string
  student?: {
    id?: string
    name?: string
    systemId?: string
  }
}

interface CourseActivitiesProps {
  facultyId: string
  courses: CourseOption[]
  enrollments: EnrollmentOption[]
}

export function CourseActivities({ facultyId, courses, enrollments }: CourseActivitiesProps) {
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [activities, setActivities] = useState<ActivityRecord[]>([])
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([])
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, { score: string; feedback: string }>>({})
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'assignment' | 'quiz' | 'task' | 'lecture'>('assignment')
  const [dueDate, setDueDate] = useState('')
  const [points, setPoints] = useState('100')
  const [contentUrl, setContentUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id)
    }
  }, [courses, selectedCourseId])

  const loadActivities = async () => {
    if (!selectedCourseId) {
      setActivities([])
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/course-activities?course=${selectedCourseId}&sort=createdAt&order=desc&limit=200`)
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load activities.')
      }

      const loadedActivities = Array.isArray(payload.data) ? payload.data : []
      setActivities(loadedActivities)
      setSelectedActivityId((previous) => previous || loadedActivities[0]?.id || '')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load activities.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadActivities()
  }, [selectedCourseId])

  const loadSubmissions = async () => {
    if (!selectedActivityId) {
      setSubmissions([])
      return
    }

    try {
      const response = await fetch(`/api/activity-submissions?activity=${selectedActivityId}&populate=student&limit=300`)
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load submissions.')
      }

      setSubmissions(Array.isArray(payload.data) ? payload.data : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load submissions.')
    }
  }

  useEffect(() => {
    loadSubmissions()
  }, [selectedActivityId])

  const enrolledStudentsForCourse = useMemo(() => {
    return enrollments
      .filter((enrollment) => enrollment.course?.id === selectedCourseId)
      .map((enrollment) => enrollment.student)
      .filter(Boolean)
  }, [enrollments, selectedCourseId])

  const uploadResourceFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'course-activities')

    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData,
    })

    const payload = await response.json()
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Unable to upload file.')
    }

    return payload.data.fileUrl as string
  }

  const createActivity = async () => {
    if (!selectedCourseId || !title.trim()) {
      setError('Course and title are required.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      let resourceUrl = contentUrl.trim()

      if (selectedFile) {
        resourceUrl = await uploadResourceFile(selectedFile)
      }

      const response = await fetch('/api/course-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course: selectedCourseId,
          faculty: facultyId,
          title: title.trim(),
          description: description.trim(),
          type,
          dueDate: dueDate || undefined,
          points: Number(points) || 0,
          contentUrl: resourceUrl,
          status: 'active',
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create activity.')
      }

      await Promise.all(
        enrolledStudentsForCourse
          .map((student) => student?.id)
          .filter(Boolean)
          .map((studentId) =>
            fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientRole: 'student',
                recipientId: studentId,
                title: `New ${type} posted`,
                message: `${title.trim()} is now available in your course.`,
                type: 'academic',
                link: '/dashboard',
              }),
            })
          )
      )

      setTitle('')
      setDescription('')
      setDueDate('')
      setPoints('100')
      setContentUrl('')
      setSelectedFile(null)
      await loadActivities()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create activity.')
    } finally {
      setIsSaving(false)
    }
  }

  const gradeSubmission = async (submission: SubmissionRecord) => {
    const score = Number(gradeDrafts[submission.id]?.score ?? submission.score ?? 0)
    const feedback = (gradeDrafts[submission.id]?.feedback ?? submission.feedback ?? '').trim()

    if (!Number.isFinite(score) || score < 0) {
      setError('Please provide a valid score.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/activity-submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          feedback,
          status: 'graded',
          gradedBy: facultyId,
          gradedAt: new Date().toISOString(),
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to grade submission.')
      }

      if (submission.student?.id) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientRole: 'student',
            recipientId: submission.student.id,
            title: 'Activity graded',
            message: `Your submission has been graded. Score: ${score}`,
            type: 'academic',
            link: '/dashboard',
          }),
        })
      }

      await loadSubmissions()
    } catch (gradeError) {
      setError(gradeError instanceof Error ? gradeError.message : 'Failed to grade submission.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Course Activities</CardTitle>
        <CardDescription>Create lectures, quizzes, tasks, assignments, and grade submissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)} className="md:col-span-2 h-10 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white">
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
            ))}
          </select>
          <select value={type} onChange={(event) => setType(event.target.value as any)} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white">
            <option value="assignment">assignment</option>
            <option value="quiz">quiz</option>
            <option value="task">task</option>
            <option value="lecture">lecture</option>
          </select>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" className="bg-gray-800 border-gray-700 text-white" />
          <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="bg-gray-800 border-gray-700 text-white" />
          <Input value={points} type="number" onChange={(event) => setPoints(event.target.value)} className="bg-gray-800 border-gray-700 text-white" placeholder="Points" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="bg-gray-800 border-gray-700 text-white" />
          <div>
            <label className="mb-1 block text-xs text-gray-400">Lecture file or resource URL (optional)</label>
            <label className="relative flex h-12 items-center justify-between rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white hover:border-cyan-500">
              <span>{selectedFile ? selectedFile.name : 'Choose a file to upload'}</span>
              <span className="text-cyan-300">Browse</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt,.zip"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] ?? null
                  setSelectedFile(file)
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
            <Input
              value={contentUrl}
              onChange={(event) => setContentUrl(event.target.value)}
              placeholder="Resource URL (optional)"
              className="mt-2 bg-gray-800 border-gray-700 text-white"
            />
            {selectedFile && <p className="mt-1 text-xs text-gray-300">Selected file: {selectedFile.name}</p>}
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={createActivity} disabled={isSaving || isLoading}>
          {isSaving ? 'Saving...' : 'Post Activity'}
        </Button>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase text-gray-400">Activities</p>
            {activities.map((activity) => (
              <button key={activity.id} onClick={() => setSelectedActivityId(activity.id)} className={`w-full rounded-lg border px-3 py-2 text-left ${selectedActivityId === activity.id ? 'border-cyan-600 bg-cyan-900/20' : 'border-gray-700 bg-gray-800/40'}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{activity.title}</p>
                  <Badge className="bg-gray-700 text-gray-100">{activity.type}</Badge>
                </div>
                <p className="text-xs text-gray-400">{activity.dueDate ? `Due ${new Date(activity.dueDate).toLocaleDateString()}` : 'No due date'} • {activity.points} pts</p>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase text-gray-400">Submissions</p>
            {submissions.length === 0 && <p className="text-sm text-gray-400">No submissions yet.</p>}
            {submissions.map((submission) => (
              <div key={submission.id} className="rounded-lg border border-gray-700 bg-gray-800/40 p-3 space-y-2">
                <p className="text-sm text-white font-semibold">{submission.student?.name ?? 'Student'} ({submission.student?.systemId ?? 'N/A'})</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={gradeDrafts[submission.id]?.score ?? (submission.score ?? '')}
                    onChange={(event) =>
                      setGradeDrafts((previous) => ({
                        ...previous,
                        [submission.id]: {
                          score: event.target.value,
                          feedback: previous[submission.id]?.feedback ?? submission.feedback ?? '',
                        },
                      }))
                    }
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Score"
                  />
                  <Input
                    value={gradeDrafts[submission.id]?.feedback ?? (submission.feedback ?? '')}
                    onChange={(event) =>
                      setGradeDrafts((previous) => ({
                        ...previous,
                        [submission.id]: {
                          score: previous[submission.id]?.score ?? String(submission.score ?? ''),
                          feedback: event.target.value,
                        },
                      }))
                    }
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Feedback"
                  />
                </div>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => gradeSubmission(submission)} disabled={isSaving}>
                  {submission.status === 'graded' ? 'Update Grade' : 'Grade Submission'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
