'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Activity {
  id: string
  title: string
  description?: string
  type: 'assignment' | 'quiz' | 'task' | 'lecture'
  dueDate?: string
  points: number
  course?: {
    id: string
    code: string
    name: string
  }
  faculty?: {
    name?: string
    systemId?: string
  }
}

interface ActivitySubmission {
  id: string
  activity?: {
    id?: string
  }
  status: string
  score: number | null
}

interface AllActivitiesProps {
  courses: Array<{
    id: string
    code: string
    name: string
  }>
  studentId?: string
}

export function AllActivities({ courses, studentId }: AllActivitiesProps) {
  const router = useRouter()
  const [allActivities, setAllActivities] = useState<Activity[]>([])
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadAllActivities()
  }, [courses, studentId])

  const loadAllActivities = async () => {
    if (!studentId) {
      setAllActivities([])
      setIsLoading(false)
      return
    }

    // If no courses were provided, attempt to discover enrolled courses for the student
    let effectiveCourses = courses
    if ((!courses || courses.length === 0) && studentId) {
      try {
        const enrollRes = await fetch(`/api/enrollments?student=${encodeURIComponent(studentId)}&limit=500`)
        const enrollJson = await enrollRes.json()
        if (enrollRes.ok && enrollJson.success && Array.isArray(enrollJson.data)) {
          const uniqueCourses = new Map<string, { id: string; code: string; name: string }>()
          for (const e of enrollJson.data) {
            const c = e.course
            if (c && c._id) uniqueCourses.set(String(c._id), { id: String(c._id), code: c.code ?? '', name: c.name ?? '' })
            else if (c && c.id) uniqueCourses.set(String(c.id), { id: String(c.id), code: c.code ?? '', name: c.name ?? '' })
          }
          effectiveCourses = Array.from(uniqueCourses.values())
        }
      } catch (err) {
        // ignore
      }
    }

    if (!effectiveCourses || effectiveCourses.length === 0) {
      setAllActivities([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const activities: Activity[] = []
      const allSubmissions: ActivitySubmission[] = []

      // Fetch activities from all courses in parallel
      const activityPromises = effectiveCourses.map((course) =>
        fetch(`/api/course-activities?course=${course.id}&sort=dueDate&order=asc&populate=faculty&limit=500`)
          .then((res) => res.json())
          .then((payload) => {
            if (payload.success && Array.isArray(payload.data)) {
              return payload.data.map((activity: any) => ({
                ...activity,
                course: {
                  id: course.id,
                  code: course.code,
                  name: course.name,
                },
              }))
            }
            return []
          })
          .catch(() => [])
      )

      const submissionPromises = effectiveCourses.map((course) =>
        fetch(`/api/activity-submissions?course=${course.id}&student=${studentId}&limit=500`)
          .then((res) => res.json())
          .then((payload) => {
            if (payload.success && Array.isArray(payload.data)) {
              return payload.data
            }
            return []
          })
          .catch(() => [])
      )

      const [activityResults, submissionResults] = await Promise.all([
        Promise.all(activityPromises),
        Promise.all(submissionPromises),
      ])

      activityResults.forEach((courseActivities) => {
        activities.push(...courseActivities)
      })

      submissionResults.forEach((courseSubmissions) => {
        allSubmissions.push(...courseSubmissions)
      })

      setAllActivities(activities)
      setSubmissions(allSubmissions)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load activities.')
    } finally {
      setIsLoading(false)
    }
  }

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

  const filteredActivities = useMemo(() => {
    const term = search.toLowerCase()
    return allActivities.filter((activity) =>
      [activity.title, activity.description, activity.course?.name, activity.course?.code]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
    )
  }, [allActivities, search])

  const getActivityStatus = (activity: Activity) => {
    const submission = submissionByActivityId.get(activity.id)
    if (submission) {
      return submission.status
    }
    if (activity.dueDate && new Date(activity.dueDate) < new Date()) {
      return 'overdue'
    }
    return 'pending'
  }

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />
      default:
        return null
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-900/30 text-blue-200'
      case 'quiz':
        return 'bg-purple-900/30 text-purple-200'
      case 'task':
        return 'bg-green-900/30 text-green-200'
      case 'lecture':
        return 'bg-amber-900/30 text-amber-200'
      default:
        return 'bg-gray-700/30 text-gray-200'
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">All Activities</CardTitle>
        <CardDescription>View all activities across your courses</CardDescription>
        <div className="mt-4">
          <Input
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && <p className="text-red-400">{error}</p>}
        {isLoading && <p className="text-gray-400">Loading activities...</p>}

        {!isLoading && filteredActivities.length === 0 && (
          <p className="text-gray-400">No activities found.</p>
        )}

        {!isLoading && filteredActivities.length > 0 && (
          <div className="space-y-3">
            {filteredActivities.map((activity) => {
              const status = getActivityStatus(activity)
              const submission = submissionByActivityId.get(activity.id)

              return (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() =>
                    router.push(
                      `/?section=activities&course=${encodeURIComponent(activity.course?.id ?? '')}`
                    )
                  }
                  className="w-full text-left p-4 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate">{activity.title}</h4>
                      <p className="text-sm text-gray-400">
                        {activity.course?.code} - {activity.course?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getActivityIcon(status)}
                      <Badge className={`${getActivityColor(activity.type)} border-0 capitalize text-xs`}>
                        {activity.type}
                      </Badge>
                    </div>
                  </div>

                  {activity.description && (
                    <p className="text-sm text-gray-300 line-clamp-2">{activity.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-4 text-gray-400">
                      <span>{activity.points} pts</span>
                      {activity.dueDate && (
                        <span>
                          Due: {new Date(activity.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>

                    {submission && (
                      <div className="text-gray-300">
                        {submission.score !== null && (
                          <span className="font-semibold">{submission.score}/{activity.points}</span>
                        )}
                        {submission.status === 'submitted' && submission.score === null && (
                          <span className="text-amber-400">Submitted - Pending Grade</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    Status:{' '}
                    <span className={`capitalize font-semibold ${
                      status === 'submitted' ? 'text-green-400' :
                      status === 'overdue' ? 'text-red-400' :
                      'text-amber-400'
                    }`}>
                      {status}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
