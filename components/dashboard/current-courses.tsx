'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''

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
  initialCourseId?: string
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

export function CurrentCourses({ courses, studentId, fullWidth, initialCourseId }: CurrentCoursesProps) {
  const router = useRouter()
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [activities, setActivities] = useState<CourseActivity[]>([])
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([])
  const [drafts, setDrafts] = useState<Record<string, { answer: string; attachmentUrl: string }>>({})
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const totalUnits = courses.reduce((sum, course) => sum + (course.units ?? 0), 0)

  useEffect(() => {
    if (!fullWidth) {
      return
    }

    if (initialCourseId && initialCourseId !== selectedCourseId && courses.some((course) => course.id === initialCourseId)) {
      setSelectedCourseId(initialCourseId)
      return
    }

    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id)
    }
  }, [courses, fullWidth, initialCourseId, selectedCourseId])

  const selectedCourse = courses.find((course) => course.id === selectedCourseId)

  const activityGroups = useMemo(
    () => [
      { type: 'assignment' as const, label: 'Assignments' },
      { type: 'quiz' as const, label: 'Quizzes' },
      { type: 'task' as const, label: 'Activities' },
      { type: 'lecture' as const, label: 'Lectures' },
    ],
    []
  )

  const groupedActivities = useMemo(() => {
    const groups: Record<string, CourseActivity[]> = {
      assignment: [],
      quiz: [],
      task: [],
      lecture: [],
    }

    for (const activity of activities) {
      if (groups[activity.type]) {
        groups[activity.type].push(activity)
      }
    }

    return groups
  }, [activities])

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

  const resolveResourceUrl = (value?: string) => {
    const url = value?.trim()
    if (!url) {
      return ''
    }

    if (/^https?:\/\//i.test(url) || /^data:/i.test(url) || /^blob:/i.test(url)) {
      return url
    }

    if (url.startsWith('/') && API_BASE_URL) {
      return `${API_BASE_URL}${url}`
    }

    return url
  }

  return (
    <Card className={`p-6 ${fullWidth ? 'bg-gray-900 border-gray-800' : ''}`}>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Current Courses</h3>
        <Badge variant="secondary">{courses.length}</Badge>
      </div>

      {!fullWidth && (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => router.push(`/?section=activities&course=${encodeURIComponent(course.id)}`)}
              className="group overflow-hidden rounded-3xl border border-gray-700 bg-gray-900/80 p-5 text-left shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-primary hover:bg-gray-900"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{course.code}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{course.name}</h3>
                </div>
                <Badge className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">{course.units} U</Badge>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-400">
                <p className="font-medium text-slate-200">{course.instructor}</p>
                <p>{course.schedule}</p>
                <p>{course.room}</p>
              </div>

              <div className="mt-5 flex items-center justify-between text-xs uppercase text-slate-500">
                <span>Tap to open</span>
                <span className="font-semibold text-slate-200">Activities</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {fullWidth && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-gray-700 bg-gray-900/80 p-6 shadow-xl shadow-black/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-primary">{selectedCourse?.code ?? 'Course'}</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{selectedCourse?.name ?? 'Select a course'}</h3>
                <p className="mt-2 max-w-xl text-sm text-slate-400">
                  {selectedCourse ? 'Here are the latest activities, assignments, quizzes, and lecture links for this subject.' : 'Choose a subject to view the activity feed.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/?section=courses')}
                className="inline-flex items-center justify-center rounded-full border border-gray-700 bg-slate-800 px-4 py-2 text-sm text-white transition hover:border-primary hover:text-primary"
              >
                Back to Subjects
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-950/80 p-4 text-sm text-slate-400">
                <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Instructor</span>
                <p className="mt-2 font-medium text-white">{selectedCourse?.instructor ?? '-'}</p>
              </div>
              <div className="rounded-2xl bg-gray-950/80 p-4 text-sm text-slate-400">
                <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Schedule</span>
                <p className="mt-2 font-medium text-white">{selectedCourse?.schedule ?? '-'}</p>
                <p className="mt-1 text-slate-400">{selectedCourse?.room ?? '-'}</p>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {isLoadingActivities && <p className="text-sm text-gray-400">Loading course activities...</p>}

          <div className="space-y-6">
            {activityGroups.map((group) => {
              const groupItems = groupedActivities[group.type]

              return (
                <div key={group.type} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{group.label}</p>
                    <span className="text-xs text-slate-500">{groupItems.length} post{groupItems.length === 1 ? '' : 's'}</span>
                  </div>

                  <div className="space-y-4">
                    {groupItems.map((activity) => {
                      const submission = submissionByActivityId.get(activity.id)
                      const draft = drafts[activity.id] ?? {
                        answer: submission?.answer ?? '',
                        attachmentUrl: submission?.attachmentUrl ?? '',
                      }

                      return (
                        <div key={activity.id} className="rounded-2xl border border-gray-700 bg-gray-800/40 p-5">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h4 className="text-base font-semibold text-white">{activity.title}</h4>
                              <p className="text-xs text-slate-400">
                                By {activity.faculty?.name ?? selectedCourse?.instructor ?? 'Faculty'}
                                {activity.dueDate ? ` • Due ${new Date(activity.dueDate).toLocaleDateString()}` : ''}
                              </p>
                            </div>
                            <Badge className="rounded-full bg-slate-900 px-2 py-1 text-xs text-slate-200">{activity.type}</Badge>
                          </div>

                          {activity.description && <p className="mt-3 text-sm text-slate-300">{activity.description}</p>}

                          <div className="mt-4 space-y-3">
                            {activity.contentUrl ? (
                              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => window.open(resolveResourceUrl(activity.contentUrl), '_blank')}>
                                {activity.type === 'lecture' ? 'Open Lecture' : 'Open Resource'}
                              </Button>
                            ) : activity.type === 'lecture' ? (
                              <p className="text-sm text-gray-400">No lecture link was provided.</p>
                            ) : null}

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

                          {submission && (
                            <div className="mt-4 rounded-2xl border border-gray-700 bg-gray-900/40 p-4 text-xs text-slate-300">
                              <p>Submission Status: {submission.status}</p>
                              {submission.score != null && <p className="text-emerald-300">Score: {submission.score}/{activity.points}</p>}
                              {submission.feedback && <p>Feedback: {submission.feedback}</p>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
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
