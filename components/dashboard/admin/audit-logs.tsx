'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type AuditLogRecord = {
  id: string
  action: string
  entity: string
  entityId: string
  details: string
  occurredAt: string
  actor?: {
    name?: string
    systemId?: string
  }
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadLogs() {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/audit-logs?populate=actor&limit=400&sort=occurredAt&order=desc')
        const payload = await response.json()

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Failed to load audit logs.')
        }

        if (mounted) {
          setLogs(Array.isArray(payload.data) ? payload.data : [])
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load audit logs.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadLogs()

    return () => {
      mounted = false
    }
  }, [])

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return logs

    return logs.filter((log) => {
      return [log.action, log.entity, log.entityId, log.details, log.actor?.name, log.actor?.systemId]
        .some((value) => String(value ?? '').toLowerCase().includes(term))
    })
  }, [logs, search])

  const getActionColor = (action: string) => {
    if (/create|add|seed/i.test(action)) return 'bg-green-900/30 text-green-200'
    if (/update|edit|approve/i.test(action)) return 'bg-blue-900/30 text-blue-200'
    if (/delete|remove|reject|drop/i.test(action)) return 'bg-red-900/30 text-red-200'
    if (/change|set|config/i.test(action)) return 'bg-yellow-900/30 text-yellow-200'
    return 'bg-gray-700/30 text-gray-200'
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Audit Logs</CardTitle>
        <CardDescription>System activity and administrative actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search logs by user, action, resource..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading logs...</p>}

        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div key={log.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                    <Badge className="bg-gray-700/40 text-gray-200">{log.entity}</Badge>
                  </div>
                  <p className="text-white text-sm"><strong>Actor:</strong> {log.actor?.name ?? 'System'} ({log.actor?.systemId ?? 'N/A'})</p>
                  <p className="text-gray-400 text-xs mt-1"><strong>Resource:</strong> {log.entityId}</p>
                  <p className="text-gray-400 text-xs"><strong>Details:</strong> {log.details}</p>
                </div>
                <div className="text-right text-gray-400 text-xs">
                  <p>{new Date(log.occurredAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
