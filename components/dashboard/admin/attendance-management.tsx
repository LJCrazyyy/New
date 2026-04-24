'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Plus, Save, Trash2, X } from 'lucide-react'

type AttendanceRecord = {
  id: string
  semester: string
  totalSessions: number
  sessionAttended: number
  attendancePercentage: number
  lastUpdated: string
  student?: {
    id?: string
    name?: string
    systemId?: string
  }
  course?: {
    id?: string
    code?: string
    name?: string
  }
}

type AttendanceForm = {
  totalSessions: string
  sessionAttended: string
}

const initialForm: AttendanceForm = {
  totalSessions: '0',
  sessionAttended: '0',
}

export function AttendanceManagement() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<AttendanceForm>(initialForm)

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/attendance?limit=500&sort=-lastUpdated&populate=student,course')
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load attendance records.')
      }

      setRecords(Array.isArray(payload.data) ? payload.data : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load attendance records.')
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
      return [record.student?.name, record.student?.systemId, record.course?.code, record.semester]
        .some((value) => String(value ?? '').toLowerCase().includes(term))
    })
  }, [records, search])

  const onStartEdit = (record: AttendanceRecord) => {
    setEditingId(record.id)
    setEditForm({
      totalSessions: String(record.totalSessions),
      sessionAttended: String(record.sessionAttended),
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
      const totalSessions = Number(editForm.totalSessions)
      const sessionAttended = Number(editForm.sessionAttended)
      const attendancePercentage = totalSessions > 0 ? (sessionAttended / totalSessions) * 100 : 0

      const response = await fetch(`/api/attendance/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalSessions,
          sessionAttended,
          attendancePercentage: Number(attendancePercentage.toFixed(2)),
          lastUpdated: new Date().toISOString(),
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update attendance.')
      }

      onCancelEdit()
      await loadData()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update attendance.')
    } finally {
      setIsSaving(false)
    }
  }

  const onDeleteRecord = async (id: string) => {
    const isConfirmed = window.confirm('Delete this attendance record? This action cannot be undone.')
    if (!isConfirmed) return

    try {
      const response = await fetch(`/api/attendance/${id}`, { method: 'DELETE' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete attendance record.')
      }

      setRecords((prev) => prev.filter((record) => record.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete attendance record.')
    }
  }

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-900/30 text-green-200 border-green-700'
    if (percentage >= 75) return 'bg-blue-900/30 text-blue-200 border-blue-700'
    if (percentage >= 70) return 'bg-yellow-900/30 text-yellow-200 border-yellow-700'
    return 'bg-red-900/30 text-red-200 border-red-700'
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div>
          <CardTitle className="text-white">Attendance Management</CardTitle>
          <CardDescription>Track and manage student course attendance</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by student, course, semester..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading attendance records...</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Student</th>
                <th className="text-left py-3 px-4 text-gray-400">Course</th>
                <th className="text-left py-3 px-4 text-gray-400">Semester</th>
                <th className="text-center py-3 px-4 text-gray-400">Sessions</th>
                <th className="text-center py-3 px-4 text-gray-400">Attended</th>
                <th className="text-center py-3 px-4 text-gray-400">Percentage</th>
                <th className="text-center py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-medium">
                    {record.student?.name ?? 'Unknown'}
                    <p className="text-xs text-gray-500">{record.student?.systemId ?? 'N/A'}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {record.course?.code} - {record.course?.name}
                  </td>
                  <td className="py-3 px-4 text-gray-400">{record.semester}</td>
                  {editingId === record.id ? (
                    <>
                      <td className="py-3 px-4 text-center">
                        <Input
                          type="number"
                          value={editForm.totalSessions}
                          onChange={(e) => setEditForm((p) => ({ ...p, totalSessions: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white text-xs w-20 mx-auto"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Input
                          type="number"
                          value={editForm.sessionAttended}
                          onChange={(e) => setEditForm((p) => ({ ...p, sessionAttended: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white text-xs w-20 mx-auto"
                        />
                      </td>
                      <td className="py-3 px-4 text-center text-gray-400">
                        {Number(editForm.totalSessions) > 0
                          ? ((Number(editForm.sessionAttended) / Number(editForm.totalSessions)) * 100).toFixed(2)
                          : '0'}%
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-center text-gray-300">{record.totalSessions}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{record.sessionAttended}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={`${getAttendanceColor(record.attendancePercentage)} border`}>
                          {record.attendancePercentage.toFixed(2)}%
                        </Badge>
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
            <p className="text-gray-500">No attendance records found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
