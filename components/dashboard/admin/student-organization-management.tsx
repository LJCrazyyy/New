'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Plus, Save, Trash2, X } from 'lucide-react'

type StudentOrganizationRecord = {
  id: string
  organizationName: string
  role: string
  joinedAt: string
  status: string
  user?: {
    id?: string
    name?: string
    systemId?: string
  }
}

type OrganizationForm = {
  organizationName: string
  role: string
  status: string
}

const initialForm: OrganizationForm = {
  organizationName: '',
  role: 'Member',
  status: 'active',
}

const roles = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Officer', 'Member']
const statuses = ['active', 'inactive', 'graduated']

export function StudentOrganizationManagement() {
  const [records, setRecords] = useState<StudentOrganizationRecord[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<OrganizationForm>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<OrganizationForm>(initialForm)

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/student-organizations?limit=500&sort=-joinedAt&populate=student')
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load organization records.')
      }

      setRecords(Array.isArray(payload.data) ? payload.data : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load organization records.')
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
      return [record.organizationName, record.role, record.user?.name, record.status]
        .some((value) => String(value ?? '').toLowerCase().includes(term))
    })
  }, [records, search])

  const onCreateRecord = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!createForm.organizationName || !createForm.role) {
      setError('Please complete all required fields.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/student-organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          joinedAt: new Date().toISOString(),
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create record.')
      }

      setCreateForm(initialForm)
      setShowCreate(false)
      await loadData()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create record.')
    } finally {
      setIsSaving(false)
    }
  }

  const onStartEdit = (record: StudentOrganizationRecord) => {
    setEditingId(record.id)
    setEditForm({
      organizationName: record.organizationName,
      role: record.role,
      status: record.status,
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

    try {
      const response = await fetch(`/api/student-organizations/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update record.')
      }

      onCancelEdit()
      await loadData()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update record.')
    } finally {
      setIsSaving(false)
    }
  }

  const onDeleteRecord = async (id: string) => {
    const isConfirmed = window.confirm('Delete this organization record? This action cannot be undone.')
    if (!isConfirmed) return

    try {
      const response = await fetch(`/api/student-organizations/${id}`, { method: 'DELETE' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete record.')
      }

      setRecords((prev) => prev.filter((record) => record.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete record.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/30 text-green-200 border-green-700'
      case 'inactive':
        return 'bg-gray-700/30 text-gray-200 border-gray-700'
      case 'graduated':
        return 'bg-blue-900/30 text-blue-200 border-blue-700'
      default:
        return 'bg-gray-700/30 text-gray-200'
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Student Organizations</CardTitle>
            <CardDescription>Manage student organization memberships and roles</CardDescription>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowCreate((prev) => !prev)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreate ? 'Close' : 'New Membership'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreate && (
          <form className="grid gap-3 md:grid-cols-4 rounded-lg border border-gray-700 bg-gray-800/40 p-4" onSubmit={onCreateRecord}>
            <Input value={createForm.organizationName} onChange={(e) => setCreateForm((p) => ({ ...p, organizationName: e.target.value }))} placeholder="Organization Name" className="bg-gray-800 border-gray-700 text-white" />
            <select value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <select value={createForm.status} onChange={(e) => setCreateForm((p) => ({ ...p, status: e.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">{isSaving ? 'Saving...' : 'Create'}</Button>
            </div>
          </form>
        )}

        <div className="relative">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by organization, role, student name, status..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading organization records...</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Organization</th>
                <th className="text-left py-3 px-4 text-gray-400">Role</th>
                <th className="text-left py-3 px-4 text-gray-400">Student</th>
                <th className="text-left py-3 px-4 text-gray-400">Joined</th>
                <th className="text-center py-3 px-4 text-gray-400">Status</th>
                <th className="text-center py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-medium">{record.organizationName}</td>
                  {editingId === record.id ? (
                    <>
                      <td className="py-3 px-4">
                        <select value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))} className="h-8 rounded-md border border-gray-600 bg-gray-700 px-2 text-sm text-white">
                          {roles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{record.user?.name ?? 'Unknown'}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{new Date(record.joinedAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-center">
                        <select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} className="h-8 rounded-md border border-gray-600 bg-gray-700 px-2 text-sm text-white">
                          {statuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-gray-300">{record.role}</td>
                      <td className="py-3 px-4 text-gray-300">{record.user?.name ?? 'Unknown'}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{new Date(record.joinedAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                      </td>
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
                        <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:text-red-300" onClick={() => onDeleteRecord(record.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No organization records found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
