'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, RefreshCw } from 'lucide-react'

type SystemSettingRecord = {
  id: string
  key: string
  value: unknown
  description: string
}

const protectedSettingKeys = new Set([
  'maintenanceMode',
  'registrationStatus',
  'currentSemester',
  'academicYear',
])

const defaultSettings: Array<{ key: string; value: unknown; description: string }> = [
  { key: 'currentSemester', value: 'Fall 2026', description: 'Active semester for the campus system' },
  { key: 'academicYear', value: '2026-2027', description: 'Current academic year' },
  { key: 'registrationStatus', value: 'open', description: 'Course registration availability' },
  { key: 'maxUnitsPerSemester', value: 21, description: 'Maximum units allowed per student per semester' },
  { key: 'gradePassingThreshold', value: 75, description: 'Minimum average required to pass a course' },
  { key: 'attendanceMinimumPercent', value: 75, description: 'Minimum attendance percentage required per course' },
  { key: 'passwordResetEnabled', value: true, description: 'Allows admin-triggered account password resets' },
  { key: 'studentSelfServiceEnabled', value: true, description: 'Enables student self-service dashboard actions' },
  { key: 'notificationPollingIntervalMs', value: 30000, description: 'Notification refresh interval in milliseconds' },
  { key: 'maintenanceMode', value: false, description: 'Puts the system in maintenance mode when enabled' },
]

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const formatValue = (value: unknown) => {
    if (typeof value === 'string') return value
    return JSON.stringify(value)
  }

  const upsertSettingByKey = async (setting: { key: string; value: unknown; description: string }) => {
    const existing = settings.find((item) => item.key === setting.key)

    if (existing) {
      const response = await fetch(`/api/system-settings/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify(setting),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || `Failed to update setting: ${setting.key}`)
      }

      return
    }

    const response = await fetch('/api/system-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify(setting),
    })

    const payload = await response.json()
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || `Failed to create setting: ${setting.key}`)
    }
  }

  const onApplySetting = async (setting: { key: string; value: unknown; description: string }) => {
    setError('')
    setIsSaving(true)

    try {
      await upsertSettingByKey(setting)
      await loadSettings()
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : `Failed to apply ${setting.key}.`)
    } finally {
      setIsSaving(false)
    }
  }

  const onApplyAllDefaults = async () => {
    setError('')
    setIsSaving(true)

    try {
      for (const setting of defaultSettings) {
        await upsertSettingByKey(setting)
      }

      await loadSettings()
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : 'Failed to apply system defaults.')
    } finally {
      setIsSaving(false)
    }
  }

  const loadSettings = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/system-settings?limit=500&sort=key&order=asc')
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load settings.')
      }

      const records = (Array.isArray(payload.data) ? payload.data : []) as SystemSettingRecord[]
      setSettings(records)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load settings.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const settingsMap = useMemo(() => {
    return new Map(settings.map((setting) => [setting.key, setting]))
  }, [settings])

  const isApplied = (setting: { key: string; value: unknown }) => {
    const existing = settingsMap.get(setting.key)
    if (!existing) return false

    return JSON.stringify(existing.value) === JSON.stringify(setting.value)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">System Defaults</CardTitle>
          <CardDescription>Click any card to apply its default value immediately.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            {defaultSettings.map((setting) => (
              <button
                key={setting.key}
                type="button"
                onClick={() => onApplySetting(setting)}
                disabled={isSaving}
                className="rounded-md border border-gray-800 bg-gray-800/30 p-3 text-left transition-colors hover:border-blue-500/60 hover:bg-gray-800/60 disabled:opacity-60"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-100">{setting.key}</p>
                  {isApplied(setting) ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Applied
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Click to apply</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{setting.description}</p>
                <p className="mt-1 text-xs text-blue-300">Default: {formatValue(setting.value)}</p>
                {protectedSettingKeys.has(setting.key) && (
                  <p className="mt-1 text-[11px] text-amber-300">Protected setting</p>
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={onApplyAllDefaults} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply All Defaults'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {isLoading && <p className="text-sm text-gray-400">Loading settings...</p>}

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Current Settings</CardTitle>
          <CardDescription>Read-only view of active configuration values.</CardDescription>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <p className="text-sm text-gray-400">No settings configured.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {settings.map((setting) => (
                <div key={setting.id} className="rounded-md border border-gray-800 bg-gray-800/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-100">{setting.key}</p>
                    {protectedSettingKeys.has(setting.key) && (
                      <span className="text-[11px] text-amber-300">Protected</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{setting.description}</p>
                  <p className="mt-1 text-xs text-blue-300">Value: {formatValue(setting.value)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
