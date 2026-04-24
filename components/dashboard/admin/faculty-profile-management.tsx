'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Plus, Save, Trash2, X } from 'lucide-react'

type FacultyProfileRecord = {
  id: string
  employeeNumber: string
  department: string
  title: string
  office: string
  user?: {
    id?: string
    name?: string
    systemId?: string
    email?: string
  }
  coursesAssigned?: Array<{
    code: string
    name: string
    section: string
  }>
}

type FacultyProfileForm = {
  employeeNumber: string
  department: string
  title: string
  office: string
}

const initialForm: FacultyProfileForm = {
  employeeNumber: '',
  department: '',
  title: '',
  office: '',
}

const departments = ['Computer Science', 'Information Technology', 'Engineering', 'Business', 'Liberal Arts', 'Sciences', 'Education']
const titles = ['Professor', 'Associate Professor', 'Assistant Professor', 'Instructor', 'Lecturer']

export function FacultyProfileManagement() {
  const [profiles, setProfiles] = useState<FacultyProfileRecord[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<FacultyProfileForm>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FacultyProfileForm>(initialForm)

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/faculty-profiles?limit=500&sort=-createdAt&populate=user,coursesAssigned')
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load faculty profiles.')
      }

      setProfiles(Array.isArray(payload.data) ? payload.data : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load faculty profiles.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return profiles

    return profiles.filter((profile) => {
      return [profile.employeeNumber, profile.user?.name, profile.department, profile.title, profile.office]
        .some((value) => String(value ?? '').toLowerCase().includes(term))
    })
  }, [profiles, search])

  const onCreateProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!createForm.employeeNumber || !createForm.department || !createForm.title || !createForm.office) {
      setError('Please complete all required fields.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/faculty-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create faculty profile.')
      }

      setCreateForm(initialForm)
      setShowCreate(false)
      await loadData()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create faculty profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const onStartEdit = (profile: FacultyProfileRecord) => {
    setEditingId(profile.id)
    setEditForm({
      employeeNumber: profile.employeeNumber,
      department: profile.department,
      title: profile.title,
      office: profile.office,
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
      const response = await fetch(`/api/faculty-profiles/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update faculty profile.')
      }

      onCancelEdit()
      await loadData()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update faculty profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const onDeleteProfile = async (id: string) => {
    const isConfirmed = window.confirm('Delete this faculty profile? This action cannot be undone.')
    if (!isConfirmed) return

    try {
      const response = await fetch(`/api/faculty-profiles/${id}`, { method: 'DELETE' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete faculty profile.')
      }

      setProfiles((prev) => prev.filter((profile) => profile.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete faculty profile.')
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Faculty Profiles</CardTitle>
            <CardDescription>Manage faculty member information and department assignments</CardDescription>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowCreate((prev) => !prev)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreate ? 'Close' : 'New Faculty'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreate && (
          <form className="grid gap-3 md:grid-cols-4 rounded-lg border border-gray-700 bg-gray-800/40 p-4" onSubmit={onCreateProfile}>
            <Input value={createForm.employeeNumber} onChange={(e) => setCreateForm((p) => ({ ...p, employeeNumber: e.target.value }))} placeholder="Employee Number" className="bg-gray-800 border-gray-700 text-white" />
            <select value={createForm.department} onChange={(e) => setCreateForm((p) => ({ ...p, department: e.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select value={createForm.title} onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
              <option value="">Select Title</option>
              {titles.map((title) => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
            <Input value={createForm.office} onChange={(e) => setCreateForm((p) => ({ ...p, office: e.target.value }))} placeholder="Office Location" className="bg-gray-800 border-gray-700 text-white" />
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">{isSaving ? 'Saving...' : 'Create Profile'}</Button>
            </div>
          </form>
        )}

        <div className="relative">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by employee number, name, department, office..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading faculty profiles...</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Employee Number</th>
                <th className="text-left py-3 px-4 text-gray-400">Name</th>
                <th className="text-left py-3 px-4 text-gray-400">Department</th>
                <th className="text-left py-3 px-4 text-gray-400">Title</th>
                <th className="text-left py-3 px-4 text-gray-400">Office</th>
                <th className="text-left py-3 px-4 text-gray-400">Courses Assigned</th>
                <th className="text-center py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((profile) => (
                <tr key={profile.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-medium">{profile.employeeNumber}</td>
                  <td className="py-3 px-4 text-gray-300">{profile.user?.name ?? 'Unknown'}</td>
                  {editingId === profile.id ? (
                    <>
                      <td className="py-3 px-4">
                        <select value={editForm.department} onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))} className="h-8 rounded-md border border-gray-600 bg-gray-700 px-2 text-sm text-white">
                          {departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} className="h-8 rounded-md border border-gray-600 bg-gray-700 px-2 text-sm text-white">
                          {titles.map((title) => (
                            <option key={title} value={title}>{title}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <Input value={editForm.office} onChange={(e) => setEditForm((p) => ({ ...p, office: e.target.value }))} className="bg-gray-700 border-gray-600 text-white text-sm" />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-gray-300">{profile.department}</td>
                      <td className="py-3 px-4 text-gray-300">{profile.title}</td>
                      <td className="py-3 px-4 text-gray-300">{profile.office}</td>
                    </>
                  )}
                  <td className="py-3 px-4">
                    {profile.coursesAssigned && profile.coursesAssigned.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {profile.coursesAssigned.slice(0, 2).map((course) => (
                          <Badge key={course.code} className="bg-blue-900/30 text-blue-200 border-blue-700 border">{course.code}</Badge>
                        ))}
                        {profile.coursesAssigned.length > 2 && (
                          <Badge className="bg-gray-700/30 text-gray-200 border-gray-700 border">+{profile.coursesAssigned.length - 2}</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {editingId === profile.id ? (
                      <div className="flex justify-center gap-2">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onSaveEdit}><Save className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="border-gray-600" onClick={onCancelEdit}><X className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="outline" className="border-blue-600 text-blue-400 hover:text-blue-300" onClick={() => onStartEdit(profile)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:text-red-300" onClick={() => onDeleteProfile(profile.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProfiles.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No faculty profiles found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
