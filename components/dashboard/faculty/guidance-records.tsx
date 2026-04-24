'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BookUser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchAllPages } from '@/lib/utils'

type CounselingRecord = {
  id: string
  topic: string
  summary: string
  nextStep: string
  sessionDate: string
  status?: string
  reply?: string
  replyAt?: string
  student?: {
    id?: string
    _id?: string
    name?: string
    systemId?: string
  }
  counselor?: {
    id?: string
    name?: string
  }
}

type DisciplineRecord = {
  id: string
  incident: string
  severity: string
  actionTaken: string
  status: string
  incidentDate: string
  student?: {
    name?: string
    systemId?: string
  }
}

type GuidanceRecordsFacultyProps = {
  facultyId: string
  mode?: 'guidance' | 'counseling'
}

export function GuidanceRecordsFaculty({ facultyId, mode = 'guidance' }: GuidanceRecordsFacultyProps) {
  const [records, setRecords] = useState<CounselingRecord[]>([])
  const [violations, setViolations] = useState<DisciplineRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [createStudentQuery, setCreateStudentQuery] = useState('')
  const [createStudentSuggestionsOpen, setCreateStudentSuggestionsOpen] = useState(false)
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10))
  const [topic, setTopic] = useState('Academic Planning')
  const [summary, setSummary] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [students, setStudents] = useState<Array<{ id: string; name: string; systemId: string }>>([])
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

  const formatStudentLabel = (student: { id: string; name: string; systemId: string }) =>
    `${student.name} (${student.systemId})`

  const loadViolations = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/discipline-records?populate=student&limit=300&sort=incidentDate&order=desc')
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load guidance records.')
      }

      setViolations(Array.isArray(payload.data) ? payload.data : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load guidance records.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCounseling = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/counseling-records?populate=student,counselor,replyBy&limit=200&sort=sessionDate&order=desc')
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load counseling records.')
      }

      setRecords(Array.isArray(payload.data) ? payload.data : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load counseling records.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (mode === 'guidance') {
      loadViolations()
      return
    }

    loadCounseling()
  }, [mode])

  useEffect(() => {
    if (mode !== 'counseling') {
      return
    }

    let mounted = true

    async function loadStudents() {
      try {
        const mappedStudents = await fetchAllPages<{ id: string; name: string; systemId: string }>((page) =>
          `/api/users?role=student&limit=100&page=${page}&sort=name&order=asc`
        ).then((data) => data.map((student) => ({
            id: student.id,
            name: student.name,
            systemId: student.systemId,
          })))

        if (mounted) {
          setStudents(mappedStudents)
          setSelectedStudentId(mappedStudents[0]?.id ?? '')
          setCreateStudentQuery(mappedStudents[0] ? formatStudentLabel(mappedStudents[0]) : '')
          setCreateStudentSuggestionsOpen(false)
        }
      } catch {
        if (mounted) {
          setStudents([])
        }
      }
    }

    loadStudents()

    return () => {
      mounted = false
    }
  }, [mode])

  const createStudentSuggestions = useMemo(() => {
    const term = createStudentQuery.trim().toLowerCase()
    const source = term
      ? students.filter((student) => formatStudentLabel(student).toLowerCase().includes(term))
      : []

    return source.slice(0, 8)
  }, [createStudentQuery, students])

  const createRecord = async () => {
    if (!selectedStudentId || !summary.trim() || !nextStep.trim()) {
      setError('Student, summary, and next step are required.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const response = await fetch('/api/counseling-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: selectedStudentId,
          counselor: facultyId,
          topic,
          summary: summary.trim(),
          nextStep: nextStep.trim(),
          sessionDate,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create counseling record.')
      }

      setSummary('')
      setNextStep('')
      setSessionDate(new Date().toISOString().slice(0, 10))
      await loadCounseling()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create counseling record.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteRecord = async (id: string) => {
    const confirmed = window.confirm('Delete this counseling record?')
    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/counseling-records/${id}`, { method: 'DELETE' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete counseling record.')
      }

      setRecords((previous) => previous.filter((record) => record.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete counseling record.')
    }
  }

  const sendReply = async (record: CounselingRecord) => {
    const replyText = (replyDrafts[record.id] ?? record.reply ?? '').trim()

    if (!replyText) {
      setError('Reply message is required.')
      return
    }

    const studentRecipientId = record.student?.id ?? record.student?._id

    if (!studentRecipientId) {
      setError('This record is missing a student reference.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/counseling-records/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: replyText,
          replyBy: facultyId,
          replyAt: new Date().toISOString(),
          status: 'closed',
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to send reply.')
      }

      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientRole: 'student',
          recipientId: studentRecipientId,
          title: 'Counseling reply received',
          message: `A faculty counselor replied to your ${record.topic.toLowerCase()} request.`,
          type: 'counseling',
          link: '/dashboard',
        }),
      })

      setReplyDrafts((previous) => ({ ...previous, [record.id]: '' }))
      await loadCounseling()
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : 'Unable to send reply.')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredViolations = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      return violations
    }

    return violations.filter((record) =>
      [record.incident, record.severity, record.status, record.student?.name, record.student?.systemId]
        .some((value) => String(value ?? '').toLowerCase().includes(term))
    )
  }, [violations, search])

  const filteredCounseling = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return records
    }

    return records.filter((record) =>
      [record.topic, record.summary, record.nextStep, record.student?.name, record.student?.systemId, record.counselor?.name]
        .some((value) => String(value ?? '').toLowerCase().includes(term))
    )
  }, [records, search])

  if (mode === 'guidance') {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookUser className="h-5 w-5 text-amber-400" />
            <div>
              <CardTitle className="text-white">Guidance Records</CardTitle>
              <CardDescription>Student violations and discipline history</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by incident, severity, student..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}
          {isLoading && <p className="text-sm text-gray-400">Loading guidance records...</p>}

          <div className="space-y-3">
            {filteredViolations.map((record) => (
              <div key={record.id} className="rounded-lg border border-gray-700 bg-gray-800/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{record.incident}</p>
                  <Badge className="bg-amber-900/40 text-amber-200">{record.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-gray-400">{record.student?.name ?? 'Unknown'} ({record.student?.systemId ?? 'N/A'})</p>
                <p className="mt-1 text-xs text-gray-300">Severity: {record.severity}</p>
                <p className="mt-1 text-xs text-gray-300">Action: {record.actionTaken}</p>
                <p className="mt-1 text-xs text-gray-500">{new Date(record.incidentDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookUser className="h-5 w-5 text-cyan-400" />
          <div>
            <CardTitle className="text-white">Counseling Records</CardTitle>
            <CardDescription>Faculty counseling sessions and replies</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div
            className="relative md:col-span-2"
            onBlur={() => setTimeout(() => setCreateStudentSuggestionsOpen(false), 100)}
          >
            <Input
              value={createStudentQuery}
              onFocus={() => setCreateStudentSuggestionsOpen(Boolean(createStudentQuery.trim()))}
              onChange={(event) => {
                const value = event.target.value
                setCreateStudentQuery(value)
                setSelectedStudentId('')
                setCreateStudentSuggestionsOpen(Boolean(value.trim()))
              }}
              placeholder="Search student by name or ID"
              className="h-10 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white placeholder-gray-500"
            />
            {createStudentSuggestionsOpen && createStudentSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-gray-700 bg-gray-900/95 shadow-lg">
                {createStudentSuggestions.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-xs text-gray-200 hover:bg-gray-800"
                    onMouseDown={() => {
                      setSelectedStudentId(student.id)
                      setCreateStudentQuery(formatStudentLabel(student))
                      setCreateStudentSuggestionsOpen(false)
                    }}
                  >
                    {formatStudentLabel(student)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <select
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="h-10 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
          >
            <option value="Academic Planning">Academic Planning</option>
            <option value="Career Guidance">Career Guidance</option>
            <option value="Stress Management">Stress Management</option>
            <option value="Personal Support">Personal Support</option>
          </select>
          <Input
            type="date"
            value={sessionDate}
            onChange={(event) => setSessionDate(event.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={createRecord} disabled={isSaving || isLoading}>
            {isSaving ? 'Saving...' : 'Add Record'}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Session summary"
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
          <Input
            value={nextStep}
            onChange={(event) => setNextStep(event.target.value)}
            placeholder="Next step"
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by student, topic, counselor..."
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading counseling records...</p>}

        {!isLoading && filteredCounseling.length === 0 && !error && (
          <p className="text-sm text-gray-400">No counseling records found.</p>
        )}

        <div className="space-y-3">
          {filteredCounseling.map((record) => (
            <div key={record.id} className="rounded-lg border border-gray-700 bg-gray-800/40 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-white">{record.topic}</h4>
                <Badge className="bg-cyan-900/40 text-cyan-200">{record.status ?? 'Counseling'}</Badge>
              </div>

              <p className="text-xs text-gray-400">
                Student: <span className="text-gray-200">{record.student?.name ?? 'Unknown'}</span>
                {' • '}
                ID: <span className="text-gray-200">{record.student?.systemId ?? 'N/A'}</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Counselor: <span className="text-gray-200">{record.counselor?.name ?? 'N/A'}</span>
                {' • '}
                Session: <span className="text-gray-200">{new Date(record.sessionDate).toLocaleDateString()}</span>
              </p>

              <div className="mt-3 space-y-2 border-t border-gray-700 pt-3">
                <p className="text-sm text-gray-200">{record.summary}</p>
                <p className="text-xs text-gray-400">
                  Next Step: <span className="text-gray-300">{record.nextStep}</span>
                </p>
              </div>

              <div className="mt-4 space-y-2 rounded-md border border-gray-700 bg-gray-900/40 p-3">
                <p className="text-xs font-semibold uppercase text-gray-400">Faculty Reply</p>
                {record.reply ? (
                  <div className="rounded-md border border-emerald-900/40 bg-emerald-950/20 p-3">
                    <p className="text-sm text-emerald-100">{record.reply}</p>
                    {record.replyAt && <p className="mt-1 text-xs text-emerald-300">{new Date(record.replyAt).toLocaleString()}</p>}
                  </div>
                ) : null}
                <textarea
                  value={replyDrafts[record.id] ?? record.reply ?? ''}
                  onChange={(event) => setReplyDrafts((previous) => ({ ...previous, [record.id]: event.target.value }))}
                  placeholder="Type faculty reply here"
                  className="min-h-24 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500"
                />
                <div className="flex items-center justify-between gap-2">
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => sendReply(record)} disabled={isSaving}>
                    {isSaving ? 'Sending...' : 'Send Reply'}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => deleteRecord(record.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
