'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'

type AcademicHistoryRecord = {
  id: string
  type: string
  description: string
  details: string
  recordedAt: string
  student?: {
    id?: string
    name?: string
    systemId?: string
  }
  relatedCourse?: {
    code?: string
    name?: string
  }
}

type HistoryForm = {
  type: string
  description: string
  details: string
}

const initialForm: HistoryForm = {
  type: 'enrollment',
  description: '',
  details: '',
}

const historyTypes = ['enrollment', 'grade-change', 'status-change', 'milestone']

export function AcademicHistoryManagement() {
  const [records, setRecords] = useState<AcademicHistoryRecord[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/academic-history?limit=500&sort=-recordedAt&populate=student,relatedCourse')
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load academic history.')
      }

      setRecords(Array.isArray(payload.data) ? payload.data : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load academic history.')
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
      return [record.student?.name, record.student?.systemId, record.description, record.type, record.relatedCourse?.code]
        .some((value) => String(value ?? '').toLowerCase().includes(term))
    })
  }, [records, search])

  const onDeleteRecord = async (id: string) => {
    const isConfirmed = window.confirm('Delete this history record? This action cannot be undone.')
    if (!isConfirmed) return

    try {
      const response = await fetch(`/api/academic-history/${id}`, { method: 'DELETE' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete record.')
      }

      setRecords((prev) => prev.filter((record) => record.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete record.')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'enrollment':
        return 'bg-blue-900/30 text-blue-200 border-blue-700'
      case 'grade-change':
        return 'bg-purple-900/30 text-purple-200 border-purple-700'
      case 'status-change':
        return 'bg-yellow-900/30 text-yellow-200 border-yellow-700'
      case 'milestone':
        return 'bg-green-900/30 text-green-200 border-green-700'
      default:
        return 'bg-gray-700/30 text-gray-200'
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div>
          <CardTitle className="text-white">Academic History</CardTitle>
          <CardDescription>View student academic records and milestones</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by student, description, course code..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading academic history...</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Student</th>
                <th className="text-left py-3 px-4 text-gray-400">Type</th>
                <th className="text-left py-3 px-4 text-gray-400">Description</th>
                <th className="text-left py-3 px-4 text-gray-400">Details</th>
                <th className="text-left py-3 px-4 text-gray-400">Course</th>
                <th className="text-left py-3 px-4 text-gray-400">Date</th>
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
                  <td className="py-3 px-4">
                    <Badge className={`${getTypeColor(record.type)} border`}>{record.type}</Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{record.description}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs max-w-xs truncate">{record.details}</td>
                  <td className="py-3 px-4 text-gray-400">{record.relatedCourse?.code ?? '-'}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{new Date(record.recordedAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-center">
                    <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:text-red-300" onClick={() => onDeleteRecord(record.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No academic history records found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
