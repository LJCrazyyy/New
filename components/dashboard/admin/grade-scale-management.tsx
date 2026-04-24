'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Plus, Save, Trash2, X } from 'lucide-react'

type GradeScaleRecord = {
  id: string
  institution: string
  letterGrade: string
  minScore: number
  maxScore: number
  pointValue: number
  description?: string
}

type GradeScaleForm = {
  institution: string
  letterGrade: string
  minScore: string
  maxScore: string
  pointValue: string
  description: string
}

const initialForm: GradeScaleForm = {
  institution: 'Campus System',
  letterGrade: 'A',
  minScore: '90',
  maxScore: '100',
  pointValue: '4',
  description: '',
}

export function GradeScaleManagement() {
  const [records, setRecords] = useState<GradeScaleRecord[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<GradeScaleForm>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<GradeScaleForm>(initialForm)

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/grade-scales?limit=500&sort=maxScore&order=desc')
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load grade scales.')
      }

      setRecords(Array.isArray(payload.data) ? payload.data : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load grade scales.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return records

    return records.filter((record) => {
      return [record.institution, record.letterGrade, record.description]
        .some((value) => String(value ?? '').toLowerCase().includes(term))
    })
  }, [records, search])

  const validateRange = (minValue: number, maxValue: number) => {
    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
      return 'Score range must be numeric.'
    }

    if (minValue < 0 || maxValue > 100 || minValue > maxValue) {
      return 'Score range must be within 0-100 and min cannot exceed max.'
    }

    return ''
  }

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    const minScore = Number(createForm.minScore)
    const maxScore = Number(createForm.maxScore)
    const pointValue = Number(createForm.pointValue)

    const rangeError = validateRange(minScore, maxScore)
    if (rangeError) {
      setError(rangeError)
      return
    }

    if (!createForm.letterGrade.trim()) {
      setError('Letter grade is required.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/grade-scales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution: createForm.institution.trim(),
          letterGrade: createForm.letterGrade.trim().toUpperCase(),
          minScore,
          maxScore,
          pointValue,
          description: createForm.description.trim(),
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create grade scale.')
      }

      setCreateForm(initialForm)
      setShowCreate(false)
      await loadData()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create grade scale.')
    } finally {
      setIsSaving(false)
    }
  }

  const onStartEdit = (record: GradeScaleRecord) => {
    setEditingId(record.id)
    setEditForm({
      institution: record.institution,
      letterGrade: record.letterGrade,
      minScore: String(record.minScore),
      maxScore: String(record.maxScore),
      pointValue: String(record.pointValue),
      description: record.description ?? '',
    })
  }

  const onCancelEdit = () => {
    setEditingId(null)
    setEditForm(initialForm)
  }

  const onSaveEdit = async () => {
    if (!editingId) return

    setError('')
    setIsSaving(true)

    const minScore = Number(editForm.minScore)
    const maxScore = Number(editForm.maxScore)
    const pointValue = Number(editForm.pointValue)

    const rangeError = validateRange(minScore, maxScore)
    if (rangeError) {
      setError(rangeError)
      setIsSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/grade-scales/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution: editForm.institution.trim(),
          letterGrade: editForm.letterGrade.trim().toUpperCase(),
          minScore,
          maxScore,
          pointValue,
          description: editForm.description.trim(),
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update grade scale.')
      }

      onCancelEdit()
      await loadData()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update grade scale.')
    } finally {
      setIsSaving(false)
    }
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this grade scale entry?')) {
      return
    }

    try {
      const response = await fetch(`/api/grade-scales/${id}`, { method: 'DELETE' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete grade scale.')
      }

      setRecords((previous) => previous.filter((record) => record.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete grade scale.')
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Grade Scale Management</CardTitle>
            <CardDescription>Configure dynamic letter grade conversion rules</CardDescription>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowCreate((previous) => !previous)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreate ? 'Close' : 'New Grade Scale'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreate && (
          <form className="grid gap-3 md:grid-cols-3 rounded-lg border border-gray-700 bg-gray-800/40 p-4" onSubmit={onCreate}>
            <Input value={createForm.institution} onChange={(event) => setCreateForm((previous) => ({ ...previous, institution: event.target.value }))} placeholder="Institution" className="bg-gray-800 border-gray-700 text-white" />
            <Input value={createForm.letterGrade} onChange={(event) => setCreateForm((previous) => ({ ...previous, letterGrade: event.target.value }))} placeholder="Letter Grade" className="bg-gray-800 border-gray-700 text-white" />
            <Input value={createForm.pointValue} onChange={(event) => setCreateForm((previous) => ({ ...previous, pointValue: event.target.value }))} placeholder="Point Value" type="number" step="0.01" className="bg-gray-800 border-gray-700 text-white" />
            <Input value={createForm.minScore} onChange={(event) => setCreateForm((previous) => ({ ...previous, minScore: event.target.value }))} placeholder="Min Score" type="number" className="bg-gray-800 border-gray-700 text-white" />
            <Input value={createForm.maxScore} onChange={(event) => setCreateForm((previous) => ({ ...previous, maxScore: event.target.value }))} placeholder="Max Score" type="number" className="bg-gray-800 border-gray-700 text-white" />
            <Input value={createForm.description} onChange={(event) => setCreateForm((previous) => ({ ...previous, description: event.target.value }))} placeholder="Description" className="bg-gray-800 border-gray-700 text-white" />
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">{isSaving ? 'Saving...' : 'Create Rule'}</Button>
            </div>
          </form>
        )}

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search grade scales by institution, grade, description..."
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading grade scales...</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Institution</th>
                <th className="text-center py-3 px-4 text-gray-400">Grade</th>
                <th className="text-center py-3 px-4 text-gray-400">Score Range</th>
                <th className="text-center py-3 px-4 text-gray-400">Point</th>
                <th className="text-left py-3 px-4 text-gray-400">Description</th>
                <th className="text-center py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-gray-200">{record.institution}</td>
                  <td className="py-3 px-4 text-center"><Badge className="bg-blue-900/30 text-blue-200">{record.letterGrade}</Badge></td>
                  {editingId === record.id ? (
                    <>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Input value={editForm.minScore} onChange={(event) => setEditForm((previous) => ({ ...previous, minScore: event.target.value }))} type="number" className="w-20 bg-gray-800 border-gray-700 text-white" />
                          <span className="text-gray-500">-</span>
                          <Input value={editForm.maxScore} onChange={(event) => setEditForm((previous) => ({ ...previous, maxScore: event.target.value }))} type="number" className="w-20 bg-gray-800 border-gray-700 text-white" />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center"><Input value={editForm.pointValue} onChange={(event) => setEditForm((previous) => ({ ...previous, pointValue: event.target.value }))} type="number" step="0.01" className="w-20 bg-gray-800 border-gray-700 text-white mx-auto" /></td>
                      <td className="py-3 px-4"><Input value={editForm.description} onChange={(event) => setEditForm((previous) => ({ ...previous, description: event.target.value }))} className="bg-gray-800 border-gray-700 text-white" /></td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-center text-gray-300">{record.minScore} - {record.maxScore}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{record.pointValue}</td>
                      <td className="py-3 px-4 text-gray-400">{record.description || '-'}</td>
                    </>
                  )}
                  <td className="py-3 px-4 text-center">
                    {editingId === record.id ? (
                      <div className="flex justify-center gap-2">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onSaveEdit}><Save className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="border-gray-600" onClick={onCancelEdit}><X className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="outline" className="border-blue-600 text-blue-400 hover:text-blue-300" onClick={() => onStartEdit(record)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:text-red-300" onClick={() => onDelete(record.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
