'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Plus, Save, Trash2, X } from 'lucide-react'

type CourseOption = {
  id: string
  code: string
  name: string
  section?: string
}

type PrerequisiteRecord = {
  id: string
  minGrade: string
  course?: CourseOption
  prerequisiteCourse?: CourseOption
}

type PrerequisiteForm = {
  course: string
  prerequisiteCourse: string
  minGrade: string
}

const initialForm: PrerequisiteForm = {
  course: '',
  prerequisiteCourse: '',
  minGrade: 'D',
}

const minGradeOptions = ['A', 'B', 'C', 'D']

export function CoursePrerequisiteManagement() {
  const [records, setRecords] = useState<PrerequisiteRecord[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<PrerequisiteForm>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<PrerequisiteForm>(initialForm)

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [prerequisiteResponse, coursesResponse] = await Promise.all([
        fetch('/api/course-prerequisites?limit=500&populate=course,prerequisiteCourse&sort=createdAt&order=desc'),
        fetch('/api/courses?limit=500&sort=code&order=asc'),
      ])

      const prerequisitePayload = await prerequisiteResponse.json()
      const coursesPayload = await coursesResponse.json()

      if (!prerequisiteResponse.ok || !prerequisitePayload.success) {
        throw new Error(prerequisitePayload.message || 'Failed to load prerequisites.')
      }

      if (!coursesResponse.ok || !coursesPayload.success) {
        throw new Error(coursesPayload.message || 'Failed to load courses.')
      }

      setRecords(Array.isArray(prerequisitePayload.data) ? prerequisitePayload.data : [])
      setCourses(Array.isArray(coursesPayload.data) ? coursesPayload.data : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load prerequisite data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!createForm.course && courses.length > 0) {
      setCreateForm((previous) => ({ ...previous, course: courses[0].id }))
    }

    if (!createForm.prerequisiteCourse && courses.length > 1) {
      setCreateForm((previous) => ({ ...previous, prerequisiteCourse: courses[1].id }))
    }
  }, [courses, createForm.course, createForm.prerequisiteCourse])

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return records

    return records.filter((record) => {
      return [record.course?.code, record.course?.name, record.prerequisiteCourse?.code, record.prerequisiteCourse?.name, record.minGrade]
        .some((value) => String(value ?? '').toLowerCase().includes(term))
    })
  }, [records, search])

  const validateForm = (form: PrerequisiteForm) => {
    if (!form.course || !form.prerequisiteCourse) {
      return 'Both target course and prerequisite course are required.'
    }

    if (form.course === form.prerequisiteCourse) {
      return 'A course cannot be its own prerequisite.'
    }

    return ''
  }

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    const validationError = validateForm(createForm)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/course-prerequisites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course: createForm.course,
          prerequisiteCourse: createForm.prerequisiteCourse,
          minGrade: createForm.minGrade,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create prerequisite rule.')
      }

      setCreateForm(initialForm)
      setShowCreate(false)
      await loadData()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create prerequisite rule.')
    } finally {
      setIsSaving(false)
    }
  }

  const onStartEdit = (record: PrerequisiteRecord) => {
    setEditingId(record.id)
    setEditForm({
      course: record.course?.id ?? '',
      prerequisiteCourse: record.prerequisiteCourse?.id ?? '',
      minGrade: record.minGrade || 'D',
    })
  }

  const onCancelEdit = () => {
    setEditingId(null)
    setEditForm(initialForm)
  }

  const onSaveEdit = async () => {
    if (!editingId) return

    setError('')
    const validationError = validateForm(editForm)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/course-prerequisites/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course: editForm.course,
          prerequisiteCourse: editForm.prerequisiteCourse,
          minGrade: editForm.minGrade,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update prerequisite rule.')
      }

      onCancelEdit()
      await loadData()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update prerequisite rule.')
    } finally {
      setIsSaving(false)
    }
  }

  const onDelete = async (id: string) => {
    if (!window.confirm('Delete this prerequisite rule?')) {
      return
    }

    try {
      const response = await fetch(`/api/course-prerequisites/${id}`, { method: 'DELETE' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete prerequisite rule.')
      }

      setRecords((previous) => previous.filter((record) => record.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete prerequisite rule.')
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Course Prerequisites</CardTitle>
            <CardDescription>Define enrollment dependencies between courses</CardDescription>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowCreate((previous) => !previous)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreate ? 'Close' : 'New Rule'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreate && (
          <form className="grid gap-3 md:grid-cols-4 rounded-lg border border-gray-700 bg-gray-800/40 p-4" onSubmit={onCreate}>
            <select value={createForm.course} onChange={(event) => setCreateForm((previous) => ({ ...previous, course: event.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
              <option value="">Select Target Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
              ))}
            </select>
            <select value={createForm.prerequisiteCourse} onChange={(event) => setCreateForm((previous) => ({ ...previous, prerequisiteCourse: event.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
              <option value="">Select Prerequisite Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
              ))}
            </select>
            <select value={createForm.minGrade} onChange={(event) => setCreateForm((previous) => ({ ...previous, minGrade: event.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
              {minGradeOptions.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">{isSaving ? 'Saving...' : 'Create Rule'}</Button>
            </div>
          </form>
        )}

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search prerequisites by course code/name..."
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading prerequisite rules...</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Target Course</th>
                <th className="text-left py-3 px-4 text-gray-400">Prerequisite</th>
                <th className="text-center py-3 px-4 text-gray-400">Min Grade</th>
                <th className="text-center py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  {editingId === record.id ? (
                    <>
                      <td className="py-3 px-4">
                        <select value={editForm.course} onChange={(event) => setEditForm((previous) => ({ ...previous, course: event.target.value }))} className="h-9 rounded-md border border-gray-700 bg-gray-800 px-2 text-sm text-white w-full">
                          {courses.map((course) => (
                            <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select value={editForm.prerequisiteCourse} onChange={(event) => setEditForm((previous) => ({ ...previous, prerequisiteCourse: event.target.value }))} className="h-9 rounded-md border border-gray-700 bg-gray-800 px-2 text-sm text-white w-full">
                          {courses.map((course) => (
                            <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select value={editForm.minGrade} onChange={(event) => setEditForm((previous) => ({ ...previous, minGrade: event.target.value }))} className="h-9 rounded-md border border-gray-700 bg-gray-800 px-2 text-sm text-white">
                          {minGradeOptions.map((grade) => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-gray-200">{record.course?.code} - {record.course?.name}</td>
                      <td className="py-3 px-4 text-gray-300">{record.prerequisiteCourse?.code} - {record.prerequisiteCourse?.name}</td>
                      <td className="py-3 px-4 text-center"><Badge className="bg-blue-900/30 text-blue-200">{record.minGrade}</Badge></td>
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
