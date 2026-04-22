'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Clock, Pencil, Plus, Save, Trash2, X } from 'lucide-react'

type UserOption = {
  id: string
  name: string
  systemId: string
}

type DisciplineRecord = {
  id: string
  incident: string
  severity: string
  actionTaken: string
  status: string
  incidentDate: string
  student?: {
    id?: string
    name?: string
    systemId?: string
  }
}

type DisciplineFormState = {
  student: string
  incident: string
  severity: string
  actionTaken: string
  status: string
  incidentDate: string
}

const initialForm: DisciplineFormState = {
  student: '',
  incident: '',
  severity: 'low',
  actionTaken: '',
  status: 'open',
  incidentDate: '',
}

const initialEditForm: DisciplineFormState = {
  student: '',
  incident: '',
  severity: 'low',
  actionTaken: '',
  status: 'open',
  incidentDate: '',
}

const PAGE_SIZE = 25

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'resolved':
      return 'bg-green-900/30 text-green-200 hover:bg-green-900/50'
    case 'pending':
      return 'bg-amber-900/30 text-amber-200 hover:bg-amber-900/50'
    case 'open':
      return 'bg-blue-900/30 text-blue-200 hover:bg-blue-900/50'
    default:
      return 'bg-gray-700/30 text-gray-200 hover:bg-gray-700/50'
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'resolved':
      return <CheckCircle2 className="h-4 w-4" />
    case 'pending':
    case 'open':
      return <Clock className="h-4 w-4" />
    default:
      return null
  }
}

export function DisciplineRecordManagement() {
  const [records, setRecords] = useState<DisciplineRecord[]>([])
  const [students, setStudents] = useState<UserOption[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<DisciplineFormState>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<DisciplineFormState>(initialEditForm)
  const [currentPage, setCurrentPage] = useState(1)

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [recordsResponse, studentsResponse] = await Promise.all([
        fetch('/api/discipline-records?populate=student&limit=200&sort=incidentDate&order=desc'),
        fetch('/api/users?role=student&limit=500&sort=name&order=asc'),
      ])

      const recordsPayload = await recordsResponse.json()
      const studentsPayload = await studentsResponse.json()

      if (!recordsResponse.ok || !recordsPayload.success) {
        throw new Error(recordsPayload.message || 'Unable to load discipline records.')
      }

      if (!studentsResponse.ok || !studentsPayload.success) {
        throw new Error(studentsPayload.message || 'Unable to load students list.')
      }

      setRecords(Array.isArray(recordsPayload.data) ? recordsPayload.data : [])
      setStudents(
        (Array.isArray(studentsPayload.data) ? studentsPayload.data : []).map((student) => ({
          id: student.id,
          name: student.name,
          systemId: student.systemId,
        }))
      )
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
      const values = [
        record.incident,
        record.severity,
        record.actionTaken,
        record.status,
        record.student?.name,
        record.student?.systemId,
      ]

      return values.some((value) => (value ?? '').toLowerCase().includes(term))
    })
  }, [records, search])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedRecords = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return filteredRecords.slice(start, start + PAGE_SIZE)
  }, [filteredRecords, safeCurrentPage])

  const onCreateRecord = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!form.student || !form.incident || !form.severity || !form.actionTaken || !form.incidentDate) {
      setError('Please complete all discipline record fields.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/discipline-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: form.student,
          incident: form.incident,
          severity: form.severity,
          actionTaken: form.actionTaken,
          status: form.status,
          incidentDate: form.incidentDate,
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create discipline record.')
      }

      setForm(initialForm)
      await loadData()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create discipline record.')
    } finally {
      setIsSaving(false)
    }
  }

  const onDeleteRecord = async (id: string) => {
    setError('')

    const isConfirmed = window.confirm('Delete this discipline record? This action cannot be undone.')
    if (!isConfirmed) {
      return
    }

    try {
      const response = await fetch(`/api/discipline-records/${id}`, {
        method: 'DELETE',
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete discipline record.')
      }

      setRecords((prev) => prev.filter((record) => record.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete discipline record.')
    }
  }

  const onStartEdit = (record: DisciplineRecord) => {
    setEditingId(record.id)
    setEditForm({
      student: record.student?.id ?? '',
      incident: record.incident ?? '',
      severity: record.severity ?? 'low',
      actionTaken: record.actionTaken ?? '',
      status: record.status ?? 'open',
      incidentDate: record.incidentDate ? record.incidentDate.slice(0, 10) : '',
    })
  }

  const onCancelEdit = () => {
    setEditingId(null)
    setEditForm(initialEditForm)
  }

  const onSaveEdit = async () => {
    if (!editingId) {
      return
    }

    setError('')

    if (!editForm.student || !editForm.incident || !editForm.severity || !editForm.actionTaken || !editForm.incidentDate) {
      setError('Please complete all edit fields before saving.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/discipline-records/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: editForm.student,
          incident: editForm.incident,
          severity: editForm.severity,
          actionTaken: editForm.actionTaken,
          status: editForm.status,
          incidentDate: editForm.incidentDate,
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update discipline record.')
      }

      onCancelEdit()
      await loadData()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update discipline record.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Discipline Record Management
          </CardTitle>
          <CardDescription>Add and manage student discipline records</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreateRecord}>
            <select
              className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white"
              value={form.student}
              onChange={(event) => setForm((prev) => ({ ...prev, student: event.target.value }))}
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.systemId})
                </option>
              ))}
            </select>

            <Input
              value={form.incident}
              onChange={(event) => setForm((prev) => ({ ...prev, incident: event.target.value }))}
              placeholder="Incident"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />

            <select
              className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white"
              value={form.severity}
              onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <Input
              value={form.actionTaken}
              onChange={(event) => setForm((prev) => ({ ...prev, actionTaken: event.target.value }))}
              placeholder="Action taken"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />

            <select
              className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>

            <Input
              type="date"
              value={form.incidentDate}
              onChange={(event) => setForm((prev) => ({ ...prev, incidentDate: event.target.value }))}
              className="bg-gray-800 border-gray-700 text-white"
            />

            <Button type="submit" disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Add Discipline Record'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">All Discipline Records</CardTitle>
          <CardDescription>Search, update, and remove records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by student, incident, severity, status..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}
          {isLoading && <p className="text-sm text-gray-400">Loading records...</p>}

          {!isLoading && filteredRecords.length === 0 && !error && (
            <p className="text-sm text-gray-400">No discipline records available.</p>
          )}

          {!isLoading && filteredRecords.length > 0 && (
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
          )}

          <div className="space-y-3">
            {paginatedRecords.map((record) => (
              <div key={record.id} className="rounded-lg border border-gray-700 bg-gray-800/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {editingId === record.id ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        <select
                          className="h-9 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
                          value={editForm.student}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, student: event.target.value }))}
                        >
                          <option value="">Select Student</option>
                          {students.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.name} ({student.systemId})
                            </option>
                          ))}
                        </select>
                        <Input
                          value={editForm.incident}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, incident: event.target.value }))}
                          className="h-9 bg-gray-800 border-gray-700 text-white"
                        />
                        <select
                          className="h-9 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
                          value={editForm.severity}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, severity: event.target.value }))}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                        <Input
                          value={editForm.actionTaken}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, actionTaken: event.target.value }))}
                          className="h-9 bg-gray-800 border-gray-700 text-white"
                        />
                        <select
                          className="h-9 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
                          value={editForm.status}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))}
                        >
                          <option value="open">Open</option>
                          <option value="pending">Pending</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <Input
                          type="date"
                          value={editForm.incidentDate}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, incidentDate: event.target.value }))}
                          className="h-9 bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-400 mb-1">{new Date(record.incidentDate).toLocaleDateString()}</p>
                        <p className="font-semibold text-white text-sm">{record.incident}</p>
                        <p className="text-xs text-gray-400">
                          {record.student?.name ?? 'Unknown'} ({record.student?.systemId ?? 'N/A'})
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(record.status)}>
                      <span className="inline-flex items-center gap-1">
                        {getStatusIcon(record.status)}
                        {record.status}
                      </span>
                    </Badge>
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
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Action Taken</p>
                    <p className="text-sm text-gray-200 mb-2">{record.actionTaken}</p>
                    <p className="text-xs text-gray-400">Severity: <span className="text-gray-300">{record.severity}</span></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
