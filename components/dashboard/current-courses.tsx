'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface CurrentCoursesProps {
  courses: Array<{
    id: string
    code: string
    name: string
    instructor: string
    schedule: string
    room: string
    units: number
    status: string
  }>
  studentId?: string
  fullWidth?: boolean
}

type CourseActivity = {
  id: string
  title: string
  description?: string
  type: 'assignment' | 'quiz' | 'task' | 'lecture'
  dueDate?: string
  points: number
  contentUrl?: string
  faculty?: {
    name?: string
    systemId?: string
  }
}

type ActivitySubmission = {
  id: string
  activity?: {
    id?: string
  }
  answer?: string
  attachmentUrl?: string
  status: string
  score: number | null
  feedback?: string
}

export function CurrentCourses({ courses, studentId, fullWidth }: CurrentCoursesProps) {
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [activities, setActivities] = useState<CourseActivity[]>([])
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([])
  const [drafts, setDrafts] = useState<Record<string, { answer: string; attachmentUrl: string }>>({})
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const totalUnits = courses.reduce((sum, course) => sum + (course.units ?? 0), 0)

  useEffect(() => {
    if (fullWidth && !selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id)
    }
  }, [courses, fullWidth, selectedCourseId])

  const selectedCourse = courses.find((course) => course.id === selectedCourseId)

  const loadActivities = async () => {
    if (!fullWidth || !selectedCourseId || !studentId) {
      return
    }

    setIsLoadingActivities(true)
    setError('')

    try {
      const [activityResponse, submissionResponse] = await Promise.all([
        fetch(`/api/course-activities?course=${selectedCourseId}&sort=createdAt&order=desc&populate=faculty&limit=200`),
        fetch(`/api/activity-submissions?course=${selectedCourseId}&student=${studentId}&sort=submittedAt&order=desc&limit=200`),
      ])

      const activityPayload = await activityResponse.json()
      const submissionPayload = await submissionResponse.json()

      if (!activityResponse.ok || !activityPayload.success) {
        throw new Error(activityPayload.message || 'Unable to load course activities.')
      }

      if (!submissionResponse.ok || !submissionPayload.success) {
        throw new Error(submissionPayload.message || 'Unable to load your submissions.')
      }

      setActivities(Array.isArray(activityPayload.data) ? activityPayload.data : [])
      setSubmissions(Array.isArray(submissionPayload.data) ? submissionPayload.data : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load course activities.')
    } finally {
      setIsLoadingActivities(false)
    }
  }

  useEffect(() => {
    loadActivities()
  }, [fullWidth, selectedCourseId, studentId])

  const submissionByActivityId = useMemo(() => {
    const mapped = new Map<string, ActivitySubmission>()

    for (const submission of submissions) {
      const activityId = submission.activity?.id
      if (activityId) {
        mapped.set(activityId, submission)
      }
    }

    return mapped
  }, [submissions])

  const submitActivity = async (activity: CourseActivity) => {
    if (!studentId || !selectedCourseId) {
      return
    }

    const draft = drafts[activity.id] ?? { answer: '', attachmentUrl: '' }
    if (!draft.answer.trim() && !draft.attachmentUrl.trim()) {
      setError('Please provide your answer or attachment URL before submitting.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const existingSubmission = submissionByActivityId.get(activity.id)
      const endpoint = existingSubmission ? `/api/activity-submissions/${existingSubmission.id}` : '/api/activity-submissions'
      const method = existingSubmission ? 'PATCH' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity: activity.id,
          course: selectedCourseId,
          student: studentId,
          answer: draft.answer.trim(),
          attachmentUrl: draft.attachmentUrl.trim(),
          submittedAt: new Date().toISOString(),
          status: 'submitted',
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to submit activity.')
      }

      await loadActivities()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit activity.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className={`p-6 ${fullWidth ? 'bg-gray-900 border-gray-800' : ''}`}>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Current Courses</h3>
        <Badge variant="secondary">{courses.length}</Badge>
      </div>

      {!fullWidth && (
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{course.code}</p>
                  <p className="font-semibold text-foreground text-sm">{course.name}</p>
                </div>
                <Badge variant="outline" className="whitespace-nowrap">
                  {course.units} units
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
                <p className="font-medium text-foreground text-xs">{course.instructor}</p>
                <p>{course.schedule}</p>
                <p>{course.room}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {fullWidth && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
            <div className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">
              {selectedCourse ? `${selectedCourse.instructor} • ${selectedCourse.schedule} • ${selectedCourse.room}` : 'Select a course'}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {isLoadingActivities && <p className="text-sm text-gray-400">Loading course activities...</p>}

          <div className="space-y-3">
            {activities.map((activity) => {
              const submission = submissionByActivityId.get(activity.id)
              const draft = drafts[activity.id] ?? {
                answer: submission?.answer ?? '',
                attachmentUrl: submission?.attachmentUrl ?? '',
              }

              return (
                <div key={activity.id} className="rounded-lg border border-gray-700 bg-gray-800/40 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-semibold text-white">{activity.title}</h4>
                      <p className="text-xs text-gray-400">
                        By {activity.faculty?.name ?? selectedCourse?.instructor ?? 'Faculty'}
                        {activity.dueDate ? ` • Due ${new Date(activity.dueDate).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                    <Badge className="bg-slate-800 text-slate-100">{activity.type}</Badge>
                  </div>

                  {activity.description && <p className="text-sm text-gray-300 mb-2">{activity.description}</p>}

                  {activity.type === 'lecture' ? (
                    <div className="flex items-center gap-2">
                      {activity.contentUrl ? (
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => window.open(activity.contentUrl, '_blank')}>
                          Open Lecture
                        </Button>
                      ) : (
                        <p className="text-sm text-gray-400">No lecture link was provided.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        value={draft.answer}
                        onChange={(event) =>
                          setDrafts((previous) => ({
                            ...previous,
                            [activity.id]: {
                              answer: event.target.value,
                              attachmentUrl: previous[activity.id]?.attachmentUrl ?? draft.attachmentUrl,
                            },
                          }))
                        }
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder={activity.type === 'quiz' ? 'Type your quiz answer here' : 'Type your submission details'}
                      />
                      <Input
                        value={draft.attachmentUrl}
                        onChange={(event) =>
                          setDrafts((previous) => ({
                            ...previous,
                            [activity.id]: {
                              answer: previous[activity.id]?.answer ?? draft.answer,
                              attachmentUrl: event.target.value,
                            },
                          }))
                        }
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="Attachment URL (optional)"
                      />
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => submitActivity(activity)} disabled={isSaving}>
                        {activity.type === 'quiz' ? 'Take Quiz / Submit' : 'Submit'}
                      </Button>
                    </div>
                  )}

                  {submission && (
                    <div className="mt-3 rounded-md border border-gray-700 bg-gray-900/40 p-3 text-xs">
                      <p className="text-gray-300">Submission Status: {submission.status}</p>
                      {submission.score != null && <p className="text-emerald-300">Score: {submission.score}/{activity.points}</p>}
                      {submission.feedback && <p className="text-gray-300">Feedback: {submission.feedback}</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="p-4 rounded-lg bg-gray-800/60 border border-gray-700">
            <p className="text-sm text-gray-300">
              Total Units This Semester: <span className="font-semibold text-white">{totalUnits} units</span>
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
