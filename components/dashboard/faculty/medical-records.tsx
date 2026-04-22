'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { HeartPulse } from 'lucide-react'

type MedicalRecord = {
  id: string
  title: string
  category: string
  notes: string
  status: string
  recordedAt: string
  student?: {
    name?: string
    systemId?: string
  }
}

export function MedicalRecordsFaculty() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadRecords() {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/medical-records?populate=student&limit=200&sort=recordedAt&order=desc')
        const payload = await response.json()

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Failed to load medical records.')
        }

        if (mounted) {
          setRecords(Array.isArray(payload.data) ? payload.data : [])
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load medical records.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadRecords()

    return () => {
      mounted = false
    }
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

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-rose-400" />
          <div>
            <CardTitle className="text-white">Medical Records</CardTitle>
            <CardDescription>Faculty view only: all student medical records</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by student, title, category..."
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading medical records...</p>}

        {!isLoading && filteredRecords.length === 0 && !error && (
          <p className="text-sm text-gray-400">No medical records found.</p>
        )}

        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <div key={record.id} className="rounded-lg border border-gray-700 bg-gray-800/40 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-white">{record.title}</h4>
                <Badge className="bg-rose-900/40 text-rose-200">{record.category}</Badge>
              </div>

              <p className="text-xs text-gray-400">
                Student: <span className="text-gray-200">{record.student?.name ?? 'Unknown'}</span>
                {' • '}
                ID: <span className="text-gray-200">{record.student?.systemId ?? 'N/A'}</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Status: <span className="text-gray-200">{record.status ?? 'active'}</span>
                {' • '}
                Recorded: <span className="text-gray-200">{new Date(record.recordedAt).toLocaleDateString()}</span>
              </p>

              <p className="mt-3 border-t border-gray-700 pt-3 text-sm text-gray-200">{record.notes}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
