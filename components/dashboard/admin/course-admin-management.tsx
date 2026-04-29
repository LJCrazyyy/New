'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Plus, Save, Trash2, X } from 'lucide-react'

type FacultyUser = {
  id: string
  name: string
  systemId: string
}

type CourseRecord = {
  id: string
  code: string
  name: string
  section: string
  units: number
  semester: string
  schedule: string
  room: string
  capacity: number
  enrolledCount: number
  faculty?: {
    id?: string
    name?: string
  }
}

type CourseForm = {
  code: string
  name: string
  section: string
  units: string
  semester: string
  schedule: string
  room: string
  capacity: string
  faculty: string
}

const initialForm: CourseForm = {
  code: '',
  name: '',
  section: '01',
  units: '3',
  semester: 'Spring 2024',
  schedule: '',
  room: '',
  capacity: '50',
  faculty: '',
}

export function CourseAdminManagement() {
  const [courses, setCourses] = useState<CourseRecord[]>([])
  const [facultyUsers, setFacultyUsers] = useState<FacultyUser[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CourseForm>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CourseForm>(initialForm)

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [coursesResponse, facultyResponse] = await Promise.all([
        fetch('/api/courses?populate=faculty&limit=500&sort=code&order=asc'),
        fetch('/api/users?role=faculty&limit=500&sort=name&order=asc'),
      ])

      const coursesPayload = await coursesResponse.json()
      const facultyPayload = await facultyResponse.json()

      if (!coursesResponse.ok || !coursesPayload.success) {
        throw new Error(coursesPayload.message || 'Failed to load courses.')
      }

      if (!facultyResponse.ok || !facultyPayload.success) {
        throw new Error(facultyPayload.message || 'Failed to load faculty users.')
      }

      setCourses(Array.isArray(coursesPayload.data) ? coursesPayload.data : [])
      setFacultyUsers(
        (Array.isArray(facultyPayload.data) ? facultyPayload.data : []).map((faculty: any) => ({
          id: faculty.id,
          name: faculty.name,
          systemId: faculty.systemId,
        }))
      )
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load course data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return courses

    return courses.filter((course) => {
      return [course.code, course.name, course.section, course.semester, course.faculty?.name]
        .some((value) => String(value ?? '').toLowerCase().includes(term))
    })
  }, [courses, search])

  const getNormalizedCapacity = (capacity: number) => Math.min(Math.max(Number(capacity ?? 0), 0), 50)

  const getNormalizedEnrollmentCount = (course: CourseRecord) => {
    return Math.min(Number(course.enrolledCount ?? 0), getNormalizedCapacity(course.capacity))
  }

  const onCreateCourse = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!createForm.code || !createForm.name || !createForm.semester || !createForm.schedule || !createForm.room) {
      setError('Please complete all required course fields.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: createForm.code,
          name: createForm.name,
          section: createForm.section,
          units: Number(createForm.units),
          semester: createForm.semester,
          schedule: createForm.schedule,
          room: createForm.room,
          capacity: Number(createForm.capacity),
          enrolledCount: 0,
          ...(createForm.faculty ? { faculty: createForm.faculty } : {}),
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create course.')
      }

      setCreateForm(initialForm)
      setShowCreate(false)
      await loadData()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create course.')
    } finally {
      setIsSaving(false)
    }
  }

  const onStartEdit = (course: CourseRecord) => {
    setEditingId(course.id)
    setEditForm({
      code: course.code,
      name: course.name,
      section: course.section,
      units: String(course.units ?? 0),
      semester: course.semester,
      schedule: course.schedule,
      room: course.room,
      capacity: String(course.capacity ?? 0),
      faculty: course.faculty?.id ?? '',
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
      const response = await fetch(`/api/courses/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editForm.code,
          name: editForm.name,
          section: editForm.section,
          units: Number(editForm.units),
          semester: editForm.semester,
          schedule: editForm.schedule,
          room: editForm.room,
          capacity: Number(editForm.capacity),
          faculty: editForm.faculty || null,
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update course.')
      }

      onCancelEdit()
      await loadData()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update course.')
    } finally {
      setIsSaving(false)
    }
  }

  const onDeleteCourse = async (id: string) => {
    const isConfirmed = window.confirm('Delete this course? This action cannot be undone.')
    if (!isConfirmed) return

    try {
      const response = await fetch(`/api/courses/${id}`, { method: 'DELETE' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete course.')
      }

      setCourses((prev) => prev.filter((course) => course.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete course.')
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Course Management</CardTitle>
            <CardDescription>Manage all academic courses and curriculum</CardDescription>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowCreate((prev) => !prev)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreate ? 'Close' : 'New Course'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreate && (
          <form className="grid gap-3 md:grid-cols-3 rounded-lg border border-gray-700 bg-gray-800/40 p-4" onSubmit={onCreateCourse}>
            <Input value={createForm.code} onChange={(e) => setCreateForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code" className="bg-gray-800 border-gray-700 text-white" />
            <Input value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} placeholder="Course name" className="bg-gray-800 border-gray-700 text-white" />
            <Input value={createForm.section} onChange={(e) => setCreateForm((p) => ({ ...p, section: e.target.value }))} placeholder="Section" className="bg-gray-800 border-gray-700 text-white" />
            <Input value={createForm.units} onChange={(e) => setCreateForm((p) => ({ ...p, units: e.target.value }))} placeholder="Units" type="number" className="bg-gray-800 border-gray-700 text-white" />
            <Input value={createForm.semester} onChange={(e) => setCreateForm((p) => ({ ...p, semester: e.target.value }))} placeholder="Semester" className="bg-gray-800 border-gray-700 text-white" />
            <Input value={createForm.schedule} onChange={(e) => setCreateForm((p) => ({ ...p, schedule: e.target.value }))} placeholder="Schedule" className="bg-gray-800 border-gray-700 text-white" />
            <Input value={createForm.room} onChange={(e) => setCreateForm((p) => ({ ...p, room: e.target.value }))} placeholder="Room" className="bg-gray-800 border-gray-700 text-white" />
            <Input value={createForm.capacity} onChange={(e) => setCreateForm((p) => ({ ...p, capacity: e.target.value }))} placeholder="Capacity" type="number" min={1} max={50} className="bg-gray-800 border-gray-700 text-white" />
            <select value={createForm.faculty} onChange={(e) => setCreateForm((p) => ({ ...p, faculty: e.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
              <option value="">Assign Faculty</option>
              {facultyUsers.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>{faculty.name} ({faculty.systemId})</option>
              ))}
            </select>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">{isSaving ? 'Saving...' : 'Create Course'}</Button>
            </div>
          </form>
        )}

        <div className="relative">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search courses by code, name, faculty..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading courses...</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Course Code</th>
                <th className="text-left py-3 px-4 text-gray-400">Course Name</th>
                <th className="text-center py-3 px-4 text-gray-400">Faculty</th>
                <th className="text-center py-3 px-4 text-gray-400">Students</th>
                <th className="text-center py-3 px-4 text-gray-400">Units</th>
                <th className="text-center py-3 px-4 text-gray-400">Status</th>
                <th className="text-center py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => {
                const normalizedCapacity = getNormalizedCapacity(course.capacity)
                const normalizedEnrollmentCount = getNormalizedEnrollmentCount(course)
                const status = normalizedEnrollmentCount >= normalizedCapacity ? 'Full' : 'Open'

                return (
                  <tr key={course.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-white font-mono">{course.code}</td>
                    <td className="py-3 px-4 text-white">{course.name}</td>
                    <td className="py-3 px-4 text-center text-gray-400 text-xs">{course.faculty?.name ?? 'Unassigned'}</td>
                    <td className="py-3 px-4 text-center text-white">{normalizedEnrollmentCount}</td>
                    <td className="py-3 px-4 text-center text-white">{course.units}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={status === 'Open' ? 'bg-green-600/50 text-green-200' : 'bg-gray-600/50 text-gray-200'}>{status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center space-x-1">
                      {editingId === course.id ? (
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
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={() => onStartEdit(course)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400" onClick={() => onDeleteCourse(course.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {editingId && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/40 p-4">
            <p className="text-sm font-semibold text-white mb-3">Editing Course</p>
            <div className="grid gap-3 md:grid-cols-3">
              <Input value={editForm.code} onChange={(e) => setEditForm((p) => ({ ...p, code: e.target.value }))} className="bg-gray-800 border-gray-700 text-white" />
              <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="bg-gray-800 border-gray-700 text-white" />
              <Input value={editForm.section} onChange={(e) => setEditForm((p) => ({ ...p, section: e.target.value }))} className="bg-gray-800 border-gray-700 text-white" />
              <Input value={editForm.units} onChange={(e) => setEditForm((p) => ({ ...p, units: e.target.value }))} type="number" className="bg-gray-800 border-gray-700 text-white" />
              <Input value={editForm.semester} onChange={(e) => setEditForm((p) => ({ ...p, semester: e.target.value }))} className="bg-gray-800 border-gray-700 text-white" />
              <Input value={editForm.schedule} onChange={(e) => setEditForm((p) => ({ ...p, schedule: e.target.value }))} className="bg-gray-800 border-gray-700 text-white" />
              <Input value={editForm.room} onChange={(e) => setEditForm((p) => ({ ...p, room: e.target.value }))} className="bg-gray-800 border-gray-700 text-white" />
              <Input value={editForm.capacity} onChange={(e) => setEditForm((p) => ({ ...p, capacity: e.target.value }))} type="number" min={1} max={50} className="bg-gray-800 border-gray-700 text-white" />
              <select value={editForm.faculty} onChange={(e) => setEditForm((p) => ({ ...p, faculty: e.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
                <option value="">Assign Faculty</option>
                {facultyUsers.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>{faculty.name} ({faculty.systemId})</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
