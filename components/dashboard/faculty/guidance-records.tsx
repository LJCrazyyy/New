'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BookUser } from 'lucide-react'

type GuidanceRecord = {
  id: string
  topic: string
  summary: string
  nextStep: string
  sessionDate: string
  student?: {
    name?: string
    systemId?: string
  }
  counselor?: {
    name?: string
  }
}

export function GuidanceRecordsFaculty() {
  const [records, setRecords] = useState<GuidanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadRecords() {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/counseling-records?populate=student,counselor&limit=200&sort=sessionDate&order=desc')
        const payload = await response.json()

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Failed to load guidance records.')
        }

        if (mounted) {
          setRecords(Array.isArray(payload.data) ? payload.data : [])
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load guidance records.')
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
      const values = [
        record.topic,
        record.summary,
        record.nextStep,
        record.student?.name,
        record.student?.systemId,
        record.counselor?.name,
      ]

      return values.some((value) => (value ?? '').toLowerCase().includes(term))
    })
  }, [records, search])

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookUser className="h-5 w-5 text-cyan-400" />
          <div>
            <CardTitle className="text-white">Guidance Records</CardTitle>
            <CardDescription>Faculty view only: all student counseling sessions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by student, topic, counselor..."
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading guidance records...</p>}

        {!isLoading && filteredRecords.length === 0 && !error && (
          <p className="text-sm text-gray-400">No guidance records found.</p>
        )}

        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <div key={record.id} className="rounded-lg border border-gray-700 bg-gray-800/40 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-white">{record.topic}</h4>
                <Badge className="bg-cyan-900/40 text-cyan-200">Guidance</Badge>
              </div>

              <p className="text-xs text-gray-400">
                Student: <span className="text-gray-200">{record.student?.name ?? 'Unknown'}</span>
                {' • '}
                ID: <span className="text-gray-200">{record.student?.systemId ?? 'N/A'}</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Counselor: <span className="text-gray-200">{record.counselor?.name ?? 'N/A'}</span>
                {' • '}
                Session: <span className="text-gray-200">{new Date(record.sessionDate).toLocaleDateString()}</span>
              </p>

              <div className="mt-3 space-y-2 border-t border-gray-700 pt-3">
                <p className="text-sm text-gray-200">{record.summary}</p>
                <p className="text-xs text-gray-400">
                  Next Step: <span className="text-gray-300">{record.nextStep}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
