'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HeartPulse, Pencil, Plus, Save, Trash2, X } from 'lucide-react'

type UserOption = {
  id: string
  name: string
  systemId: string
}

type MedicalRecord = {
  id: string
  title: string
  category: string
  notes: string
  status: string
  recordedAt: string
  student?: {
    id?: string
    name?: string
    systemId?: string
  }
}

type MedicalFormState = {
  student: string
  title: string
  category: string
  notes: string
  status: string
  recordedAt: string
}

const initialForm: MedicalFormState = {
  student: '',
  title: '',
  category: '',
  notes: '',
  status: 'active',
  recordedAt: '',
}

const initialEditForm: MedicalFormState = {
  student: '',
  title: '',
  category: '',
  notes: '',
  status: 'active',
  recordedAt: '',
}

const PAGE_SIZE = 25

export function MedicalRecordManagement() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [students, setStudents] = useState<UserOption[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<MedicalFormState>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<MedicalFormState>(initialEditForm)
  const [currentPage, setCurrentPage] = useState(1)

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [recordsResponse, studentsResponse] = await Promise.all([
        fetch('/api/medical-records?populate=student&limit=200&sort=recordedAt&order=desc'),
        fetch('/api/users?role=student&limit=500&sort=name&order=asc'),
      ])

      const recordsPayload = await recordsResponse.json()
      const studentsPayload = await studentsResponse.json()

      if (!recordsResponse.ok || !recordsPayload.success) {
        throw new Error(recordsPayload.message || 'Unable to load medical records.')
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
      const values = [record.title, record.category, record.notes, record.status, record.student?.name, record.student?.systemId]
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

    if (!form.student || !form.title || !form.category || !form.notes) {
      setError('Please complete all medical record fields.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: form.student,
          title: form.title,
          category: form.category,
          notes: form.notes,
          status: form.status,
          ...(form.recordedAt ? { recordedAt: form.recordedAt } : {}),
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create medical record.')
      }

      setForm(initialForm)
      await loadData()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create medical record.')
    } finally {
      setIsSaving(false)
    }
  }

  const onDeleteRecord = async (id: string) => {
    setError('')

    const isConfirmed = window.confirm('Delete this medical record? This action cannot be undone.')
    if (!isConfirmed) {
      return
    }

    try {
      const response = await fetch(`/api/medical-records/${id}`, {
        method: 'DELETE',
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete medical record.')
      }

      setRecords((prev) => prev.filter((record) => record.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete medical record.')
    }
  }

  const onStartEdit = (record: MedicalRecord) => {
    setEditingId(record.id)
    setEditForm({
      student: record.student?.id ?? '',
      title: record.title ?? '',
      category: record.category ?? '',
      notes: record.notes ?? '',
      status: record.status ?? 'active',
      recordedAt: record.recordedAt ? record.recordedAt.slice(0, 10) : '',
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

    if (!editForm.student || !editForm.title || !editForm.category || !editForm.notes) {
      setError('Please complete all edit fields before saving.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/medical-records/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: editForm.student,
          title: editForm.title,
          category: editForm.category,
          notes: editForm.notes,
          status: editForm.status,
          ...(editForm.recordedAt ? { recordedAt: editForm.recordedAt } : {}),
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update medical record.')
      }

      onCancelEdit()
      await loadData()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update medical record.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-rose-400" />
            Medical Record Management
          </CardTitle>
          <CardDescription>Add and manage student medical records</CardDescription>
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
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Record title"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />

            <Input
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Category"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />

            <Input
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Medical notes"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />

            <select
              className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>

            <Input
              type="date"
              value={form.recordedAt}
              onChange={(event) => setForm((prev) => ({ ...prev, recordedAt: event.target.value }))}
              className="bg-gray-800 border-gray-700 text-white"
            />

            <Button type="submit" disabled={isSaving} className="bg-rose-600 hover:bg-rose-700">
              <Plus className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Add Medical Record'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">All Medical Records</CardTitle>
          <CardDescription>View and delete records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by student, title, category..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}
          {isLoading && <p className="text-sm text-gray-400">Loading records...</p>}

          {!isLoading && filteredRecords.length === 0 && !error && (
            <p className="text-sm text-gray-400">No medical records available.</p>
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
                <div className="flex items-center justify-between gap-3">
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
                          value={editForm.title}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
                          className="h-9 bg-gray-800 border-gray-700 text-white"
                        />
                        <Input
                          value={editForm.category}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, category: event.target.value }))}
                          className="h-9 bg-gray-800 border-gray-700 text-white"
                        />
                        <Input
                          value={editForm.notes}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, notes: event.target.value }))}
                          className="h-9 bg-gray-800 border-gray-700 text-white"
                        />
                        <select
                          className="h-9 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
                          value={editForm.status}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))}
                        >
                          <option value="active">Active</option>
                          <option value="resolved">Resolved</option>
                          <option value="archived">Archived</option>
                        </select>
                        <Input
                          type="date"
                          value={editForm.recordedAt}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, recordedAt: event.target.value }))}
                          className="h-9 bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-white text-sm">{record.title}</p>
                        <p className="text-xs text-gray-400">
                          {record.student?.name ?? 'Unknown'} ({record.student?.systemId ?? 'N/A'})
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-rose-900/40 text-rose-200">{record.category}</Badge>
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
                    <p className="mt-2 text-sm text-gray-300">{record.notes}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Status: <span className="text-gray-300">{record.status ?? 'active'}</span>
                      {' • '}
                      Date: <span className="text-gray-300">{new Date(record.recordedAt).toLocaleDateString()}</span>
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
