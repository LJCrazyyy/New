'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit, Plus, Save, Trash2, X } from 'lucide-react'

type StudentProfileRecord = {
  id: string
  studentNumber: string
  course: string
  section: string
  yearLevel: string
  gpa: number
  unitsCompleted: number
  unitsEnrolled: number
  user?: {
    id?: string
    name?: string
    systemId?: string
    email?: string
  }
}

type StudentProfileForm = {
  studentNumber: string
  course: string
  section: string
  yearLevel: string
  assignDefaultCourses?: boolean
}

const initialForm: StudentProfileForm = {
  studentNumber: '',
  course: '',
  section: '',
  yearLevel: '1st Year',
  assignDefaultCourses: true,
}

const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']
const API_PAGE_LIMIT = 100
const PAGE_SIZE_OPTIONS = [25, 50, 100]

export function StudentProfileManagement() {
  const [profiles, setProfiles] = useState<StudentProfileRecord[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<StudentProfileForm>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<StudentProfileForm>(initialForm)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const allProfiles: StudentProfileRecord[] = []
      let page = 1
      let totalPages = 1

      while (page <= totalPages) {
        const response = await fetch(
          `/api/student-profiles?limit=${API_PAGE_LIMIT}&page=${page}&sort=-createdAt&populate=user`
        )
        const payload = await response.json()

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Failed to load student profiles.')
        }

        const pageProfiles = Array.isArray(payload.data) ? (payload.data as StudentProfileRecord[]) : []
        allProfiles.push(...pageProfiles)

        const pagesFromMeta = Number(payload?.meta?.pagination?.pages)
        totalPages = Number.isFinite(pagesFromMeta) && pagesFromMeta > 0 ? pagesFromMeta : 1
        page += 1
      }

      setProfiles(allProfiles)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load student profiles.')
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
      return [profile.studentNumber, profile.user?.name, profile.course, profile.section, profile.yearLevel]
        .some((value) => String(value ?? '').toLowerCase().includes(term))
    })
  }, [profiles, search])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedProfiles = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return filteredProfiles.slice(start, start + pageSize)
  }, [filteredProfiles, pageSize, safeCurrentPage])

  const onCreateProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!createForm.studentNumber || !createForm.course || !createForm.section) {
      setError('Please complete all required fields.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/student-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create student profile.')
      }

      setCreateForm(initialForm)
      setShowCreate(false)
      await loadData()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create student profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const onStartEdit = (profile: StudentProfileRecord) => {
    setEditingId(profile.id)
    setEditForm({
      studentNumber: profile.studentNumber,
      course: profile.course,
      section: profile.section,
      yearLevel: profile.yearLevel,
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
      const response = await fetch(`/api/student-profiles/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update student profile.')
      }

      onCancelEdit()
      await loadData()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update student profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const onDeleteProfile = async (id: string) => {
    const isConfirmed = window.confirm('Delete this student profile? This action cannot be undone.')
    if (!isConfirmed) return

    try {
      const response = await fetch(`/api/student-profiles/${id}`, { method: 'DELETE' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete student profile.')
      }

      setProfiles((prev) => prev.filter((profile) => profile.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete student profile.')
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Student Profiles</CardTitle>
            <CardDescription>Manage student profile information and academic data</CardDescription>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowCreate((prev) => !prev)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreate ? 'Close' : 'New Profile'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreate && (
          <form className="grid gap-3 md:grid-cols-4 rounded-lg border border-gray-700 bg-gray-800/40 p-4" onSubmit={onCreateProfile}>
            <Input value={createForm.studentNumber} onChange={(e) => setCreateForm((p) => ({ ...p, studentNumber: e.target.value }))} placeholder="Student Number" className="bg-gray-800 border-gray-700 text-white" />
            <Input value={createForm.course} onChange={(e) => setCreateForm((p) => ({ ...p, course: e.target.value }))} placeholder="Course/Program" className="bg-gray-800 border-gray-700 text-white" />
            <Input value={createForm.section} onChange={(e) => setCreateForm((p) => ({ ...p, section: e.target.value }))} placeholder="Section" className="bg-gray-800 border-gray-700 text-white" />
            <select value={createForm.yearLevel} onChange={(e) => setCreateForm((p) => ({ ...p, yearLevel: e.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
              {yearLevels.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={Boolean(createForm.assignDefaultCourses)}
                onChange={(e) => setCreateForm((p) => ({ ...p, assignDefaultCourses: e.target.checked }))}
              />
              <span>Assign default courses for current semester</span>
            </label>
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">{isSaving ? 'Saving...' : 'Create Profile'}</Button>
            </div>
          </form>
        )}

        <div className="relative">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by student number, name, course, section..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading student profiles...</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Student Number</th>
                <th className="text-left py-3 px-4 text-gray-400">Name</th>
                <th className="text-left py-3 px-4 text-gray-400">Course</th>
                <th className="text-left py-3 px-4 text-gray-400">Section</th>
                <th className="text-left py-3 px-4 text-gray-400">Year Level</th>
                <th className="text-center py-3 px-4 text-gray-400">GPA</th>
                <th className="text-center py-3 px-4 text-gray-400">Units Completed</th>
                <th className="text-center py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProfiles.map((profile) => (
                <tr key={profile.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-medium">{profile.studentNumber}</td>
                  <td className="py-3 px-4 text-gray-300">{profile.user?.name ?? 'Unknown'}</td>
                  {editingId === profile.id ? (
                    <>
                      <td className="py-3 px-4">
                        <Input value={editForm.course} onChange={(e) => setEditForm((p) => ({ ...p, course: e.target.value }))} className="bg-gray-700 border-gray-600 text-white" />
                      </td>
                      <td className="py-3 px-4">
                        <Input value={editForm.section} onChange={(e) => setEditForm((p) => ({ ...p, section: e.target.value }))} className="bg-gray-700 border-gray-600 text-white" />
                      </td>
                      <td className="py-3 px-4">
                        <select value={editForm.yearLevel} onChange={(e) => setEditForm((p) => ({ ...p, yearLevel: e.target.value }))} className="h-8 rounded-md border border-gray-600 bg-gray-700 px-2 text-sm text-white">
                          {yearLevels.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-gray-300">{profile.course}</td>
                      <td className="py-3 px-4 text-gray-300">{profile.section}</td>
                      <td className="py-3 px-4 text-gray-300">{profile.yearLevel}</td>
                    </>
                  )}
                  <td className="py-3 px-4 text-center text-gray-300">{profile.gpa.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center text-gray-300">{profile.unitsCompleted}</td>
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

        {filteredProfiles.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-800 pt-4 text-sm text-gray-400 md:flex-row md:items-center md:justify-between">
            <p>
              Showing {(safeCurrentPage - 1) * pageSize + 1}-
              {Math.min(safeCurrentPage * pageSize, filteredProfiles.length)} of {filteredProfiles.length} profiles
            </p>
            <div className="flex items-center gap-2">
              <label className="text-gray-400">Show</label>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-8 rounded-md border border-gray-700 bg-gray-900 px-2 text-sm text-white"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="text-gray-400">per page</span>
              <span>
                Page {safeCurrentPage} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-700 text-gray-300"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-700 text-gray-300"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {filteredProfiles.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No student profiles found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
