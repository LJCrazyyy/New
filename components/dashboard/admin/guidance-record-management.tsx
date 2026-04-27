'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookUser, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { fetchAllPages } from '@/lib/utils'

type UserOption = {
  id: string
  name: string
  systemId: string
}

type GuidanceRecord = {
  id: string
  topic: string
  summary: string
  nextStep: string
  sessionDate: string
  student?: {
    id?: string
    name?: string
    systemId?: string
  }
  counselor?: {
    name?: string
  }
}

type GuidanceFormState = {
  student: string
  topic: string
  summary: string
  nextStep: string
  sessionDate: string
}

const initialForm: GuidanceFormState = {
  student: '',
  topic: '',
  summary: '',
  nextStep: '',
  sessionDate: '',
}

const initialEditForm: GuidanceFormState = {
  student: '',
  topic: '',
  summary: '',
  nextStep: '',
  sessionDate: '',
}

export function GuidanceRecordManagement() {
  const [records, setRecords] = useState<GuidanceRecord[]>([])
  const [students, setStudents] = useState<UserOption[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<GuidanceFormState>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<GuidanceFormState>(initialEditForm)
  const [createStudentQuery, setCreateStudentQuery] = useState('')
  const [editStudentQuery, setEditStudentQuery] = useState('')
  const [createStudentSuggestionsOpen, setCreateStudentSuggestionsOpen] = useState(false)
  const [editStudentSuggestionsOpen, setEditStudentSuggestionsOpen] = useState(false)

  const formatStudentLabel = (student: UserOption) => `${student.name} (${student.systemId})`

  const createStudentSuggestions = useMemo(() => {
    const term = createStudentQuery.trim().toLowerCase()
    const source = term
      ? students.filter((student) => formatStudentLabel(student).toLowerCase().includes(term))
      : []

    return source.slice(0, 8)
  }, [createStudentQuery, students])

  const editStudentSuggestions = useMemo(() => {
    const term = editStudentQuery.trim().toLowerCase()
    const source = term
      ? students.filter((student) => formatStudentLabel(student).toLowerCase().includes(term))
      : []

    return source.slice(0, 8)
  }, [editStudentQuery, students])

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [recordsResponse, studentData] = await Promise.all([
        fetch('/api/counseling-records?populate=student,counselor&limit=200&sort=sessionDate&order=desc'),
        fetchAllPages<{ id: string; name: string; systemId: string }>((page) =>
          `/api/users?role=student&limit=100&page=${page}&sort=name&order=asc`
        ),
      ])

      const recordsPayload = await recordsResponse.json()

      if (!recordsResponse.ok || !recordsPayload.success) {
        throw new Error(recordsPayload.message || 'Unable to load guidance records.')
      }

      setRecords(Array.isArray(recordsPayload.data) ? recordsPayload.data : [])
      setStudents(studentData.map((student) => ({ id: student.id, name: student.name, systemId: student.systemId })))
      setCreateStudentQuery('')
      setCreateStudentSuggestionsOpen(false)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load module data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return records
    }

    return records.filter((record) => {
      const values = [record.topic, record.summary, record.nextStep, record.student?.name, record.student?.systemId, record.counselor?.name]
      return values.some((value) => (value ?? '').toLowerCase().includes(term))
    })
  }, [records, search])

  const onCreateRecord = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!form.student || !form.topic || !form.summary || !form.nextStep || !form.sessionDate) {
      setError('Please complete all guidance record fields.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/counseling-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: form.student,
          topic: form.topic,
          summary: form.summary,
          nextStep: form.nextStep,
          sessionDate: form.sessionDate,
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create guidance record.')
      }

      setForm(initialForm)
      setCreateStudentQuery('')
      setCreateStudentSuggestionsOpen(false)
      await loadData()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create guidance record.')
    } finally {
      setIsSaving(false)
    }
  }

  const onDeleteRecord = async (id: string) => {
    setError('')

    const isConfirmed = window.confirm('Delete this guidance record? This action cannot be undone.')
    if (!isConfirmed) {
      return
    }

    try {
      const response = await fetch(`/api/counseling-records/${id}`, {
        method: 'DELETE',
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete guidance record.')
      }

      setRecords((prev) => prev.filter((record) => record.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete guidance record.')
    }
  }

  const onStartEdit = (record: GuidanceRecord) => {
    setEditingId(record.id)
    setEditForm({
      student: record.student?.id ?? '',
      topic: record.topic ?? '',
      summary: record.summary ?? '',
      nextStep: record.nextStep ?? '',
      sessionDate: record.sessionDate ? record.sessionDate.slice(0, 10) : '',
    })
    setEditStudentQuery(record.student ? `${record.student.name} (${record.student.systemId})` : '')
    setEditStudentSuggestionsOpen(false)
  }

  const onCancelEdit = () => {
    setEditingId(null)
    setEditForm(initialEditForm)
    setEditStudentQuery('')
    setEditStudentSuggestionsOpen(false)
  }

  const onSaveEdit = async () => {
    if (!editingId) {
      return
    }

    setError('')

    if (!editForm.student || !editForm.topic || !editForm.summary || !editForm.nextStep || !editForm.sessionDate) {
      setError('Please complete all edit fields before saving.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/counseling-records/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: editForm.student,
          topic: editForm.topic,
          summary: editForm.summary,
          nextStep: editForm.nextStep,
          sessionDate: editForm.sessionDate,
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update guidance record.')
      }

      onCancelEdit()
      await loadData()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update guidance record.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BookUser className="h-5 w-5 text-cyan-400" />
            Guidance Record Management
          </CardTitle>
          <CardDescription>Add and manage student guidance records</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreateRecord}>
            <div
              className="relative"
              onBlur={() => setTimeout(() => setCreateStudentSuggestionsOpen(false), 100)}
            >
              <Input
                value={createStudentQuery}
                onFocus={() => setCreateStudentSuggestionsOpen(Boolean(createStudentQuery.trim()))}
                onChange={(event) => {
                  const value = event.target.value
                  setCreateStudentQuery(value)
                  setForm((prev) => ({ ...prev, student: '' }))
                  setCreateStudentSuggestionsOpen(Boolean(value.trim()))
                }}
                placeholder="Search student by name or ID"
                className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white placeholder-gray-500"
              />
              {createStudentSuggestionsOpen && createStudentSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-gray-700 bg-gray-900/95 shadow-lg">
                  {createStudentSuggestions.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-xs text-gray-200 hover:bg-gray-800"
                      onMouseDown={() => {
                        setForm((prev) => ({ ...prev, student: student.id }))
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

            <Input
              value={form.topic}
              onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))}
              placeholder="Guidance topic"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />

            <Input
              value={form.summary}
              onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
              placeholder="Session summary"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />

            <Input
              value={form.nextStep}
              onChange={(event) => setForm((prev) => ({ ...prev, nextStep: event.target.value }))}
              placeholder="Next step"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />

            <Input
              type="date"
              value={form.sessionDate}
              onChange={(event) => setForm((prev) => ({ ...prev, sessionDate: event.target.value }))}
              className="bg-gray-800 border-gray-700 text-white"
            />

            <Button type="submit" disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Add Guidance Record'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">All Guidance Records</CardTitle>
          <CardDescription>View and delete records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by student, counselor, topic..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}
          {isLoading && <p className="text-sm text-gray-400">Loading records...</p>}

          {!isLoading && filteredRecords.length === 0 && !error && (
            <p className="text-sm text-gray-400">No guidance records available.</p>
          )}

          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <div key={record.id} className="rounded-lg border border-gray-700 bg-gray-800/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    {editingId === record.id ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        <div
                          className="relative"
                          onBlur={() => setTimeout(() => setEditStudentSuggestionsOpen(false), 100)}
                        >
                          <Input
                            value={editStudentQuery}
                            onFocus={() => setEditStudentSuggestionsOpen(Boolean(editStudentQuery.trim()))}
                            onChange={(event) => {
                              const value = event.target.value
                              setEditStudentQuery(value)
                              setEditForm((prev) => ({ ...prev, student: '' }))
                              setEditStudentSuggestionsOpen(Boolean(value.trim()))
                            }}
                            placeholder="Search student by name or ID"
                            className="h-9 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white placeholder-gray-500"
                          />
                          {editStudentSuggestionsOpen && editStudentSuggestions.length > 0 && (
                            <div className="absolute z-10 mt-1 max-h-36 w-full overflow-y-auto rounded-md border border-gray-700 bg-gray-900/95 shadow-lg">
                              {editStudentSuggestions.map((student) => (
                                <button
                                  key={student.id}
                                  type="button"
                                  className="w-full px-2 py-1.5 text-left text-xs text-gray-200 hover:bg-gray-800"
                                  onMouseDown={() => {
                                    setEditForm((prev) => ({ ...prev, student: student.id }))
                                    setEditStudentQuery(formatStudentLabel(student))
                                    setEditStudentSuggestionsOpen(false)
                                  }}
                                >
                                  {formatStudentLabel(student)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <Input
                          value={editForm.topic}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, topic: event.target.value }))}
                          className="h-9 bg-gray-800 border-gray-700 text-white"
                        />
                        <Input
                          value={editForm.summary}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, summary: event.target.value }))}
                          className="h-9 bg-gray-800 border-gray-700 text-white"
                        />
                        <Input
                          value={editForm.nextStep}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, nextStep: event.target.value }))}
                          className="h-9 bg-gray-800 border-gray-700 text-white"
                        />
                        <Input
                          type="date"
                          value={editForm.sessionDate}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, sessionDate: event.target.value }))}
                          className="h-9 bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-white text-sm">{record.topic}</p>
                        <p className="text-xs text-gray-400">
                          {record.student?.name ?? 'Unknown'} ({record.student?.systemId ?? 'N/A'})
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-cyan-900/40 text-cyan-200">{new Date(record.sessionDate).toLocaleDateString()}</Badge>
                    {editingId === record.id ? (
                      <>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-green-400" onClick={onSaveEdit}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={onCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-cyan-300"
                          onClick={() => onStartEdit(record)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-red-400"
                          onClick={() => onDeleteRecord(record.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {editingId !== record.id && (
                  <>
                    <p className="mt-2 text-sm text-gray-300">{record.summary}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Next: <span className="text-gray-300">{record.nextStep}</span>
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
