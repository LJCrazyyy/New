'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { HeartPulse } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchAllPages } from '@/lib/utils'

type MedicalRecord = {
  id: string
  title: string
  category: string
  notes: string
  status: string
  recordedAt: string
  student?: {
    name?: string
    systemId?: string
  }
}

type MedicalRecordsFacultyProps = {
  facultyId: string
}

export function MedicalRecordsFaculty({ facultyId }: MedicalRecordsFacultyProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [createStudentQuery, setCreateStudentQuery] = useState('')
  const [createStudentSuggestionsOpen, setCreateStudentSuggestionsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('condition')
  const [status, setStatus] = useState('active')
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [students, setStudents] = useState<Array<{ id: string; name: string; systemId: string }>>([])

  const formatStudentLabel = (student: { id: string; name: string; systemId: string }) =>
    `${student.name} (${student.systemId})`

  const loadRecords = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/medical-records?populate=student&limit=200&sort=recordedAt&order=desc')
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load medical records.')
      }

      setRecords(Array.isArray(payload.data) ? payload.data : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load medical records.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [])

  const createStudentSuggestions = useMemo(() => {
    const term = createStudentQuery.trim().toLowerCase()
    const source = term
      ? students.filter((student) => formatStudentLabel(student).toLowerCase().includes(term))
      : []

    return source.slice(0, 8)
  }, [createStudentQuery, students])

  useEffect(() => {
    let mounted = true

    async function loadStudents() {
      try {
        const mappedStudents = await fetchAllPages<{ id: string; name: string; systemId: string }>((page) =>
          `/api/users?role=student&limit=100&page=${page}&sort=name&order=asc`
        ).then((data) =>
          data.map((student) => ({
            id: student.id,
            name: student.name,
            systemId: student.systemId,
          }))
        )

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
  }, [])

  const createRecord = async () => {
    if (!selectedStudentId || !title.trim() || !notes.trim()) {
      setError('Student, title, and notes are required.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: selectedStudentId,
          title: title.trim(),
          category,
          status,
          notes: notes.trim(),
          recordedAt,
          createdBy: facultyId,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create medical record.')
      }

      setTitle('')
      setNotes('')
      setRecordedAt(new Date().toISOString().slice(0, 10))
      await loadRecords()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create medical record.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteRecord = async (id: string) => {
    const confirmed = window.confirm('Delete this medical record?')
    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/medical-records/${id}`, { method: 'DELETE' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete medical record.')
      }

      setRecords((previous) => previous.filter((record) => record.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete medical record.')
    }
  }

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return records
    }

    return records.filter((record) => {
      const values = [record.title, record.category, record.notes, record.status, record.student?.name, record.student?.systemId]
      return values.some((value) => (value ?? '').toLowerCase().includes(term))
    })
  }, [records, search])

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-rose-400" />
          <div>
            <CardTitle className="text-white">Medical Records</CardTitle>
            <CardDescription>Faculty view only: all student medical records</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
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
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Record title"
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-10 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
          >
            <option value="allergy">allergy</option>
            <option value="condition">condition</option>
            <option value="medication">medication</option>
            <option value="consultation">consultation</option>
            <option value="other">other</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
          >
            <option value="active">active</option>
            <option value="monitoring">monitoring</option>
            <option value="resolved">resolved</option>
          </select>
          <Input
            type="date"
            value={recordedAt}
            onChange={(event) => setRecordedAt(event.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Medical notes"
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
          <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={createRecord} disabled={isSaving || isLoading}>
            {isSaving ? 'Saving...' : 'Add Record'}
          </Button>
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by student, title, category..."
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading medical records...</p>}

        {!isLoading && filteredRecords.length === 0 && !error && (
          <p className="text-sm text-gray-400">No medical records found.</p>
        )}

        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <div key={record.id} className="rounded-lg border border-gray-700 bg-gray-800/40 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-white">{record.title}</h4>
                <Badge className="bg-rose-900/40 text-rose-200">{record.category}</Badge>
              </div>

              <p className="text-xs text-gray-400">
                Student: <span className="text-gray-200">{record.student?.name ?? 'Unknown'}</span>
                {' • '}
                ID: <span className="text-gray-200">{record.student?.systemId ?? 'N/A'}</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Status: <span className="text-gray-200">{record.status ?? 'active'}</span>
                {' • '}
                Recorded: <span className="text-gray-200">{new Date(record.recordedAt).toLocaleDateString()}</span>
              </p>

              <div className="mt-3 border-t border-gray-700 pt-3 flex items-center justify-between gap-2">
                <p className="text-sm text-gray-200">{record.notes}</p>
                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => deleteRecord(record.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
