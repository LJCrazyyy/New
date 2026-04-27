'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCheck, ChevronRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserData } from '@/components/login-page'

type NotificationRecord = {
  id: string
  title: string
  message: string
  type: 'system' | 'enrollment' | 'academic' | 'attendance' | 'discipline'
  link?: string
  isRead?: boolean
  createdAt?: string
}

type NotificationBellProps = {
  currentUser: UserData
  onNavigateSection?: (section: string) => void
}

function resolveSectionFromType(role: UserData['role'], type: NotificationRecord['type']) {
  if (role === 'student') {
    if (type === 'academic') return 'grades'
    if (type === 'enrollment' || type === 'attendance') return 'courses'
    if (type === 'discipline') return 'discipline'
    return 'overview'
  }

  if (role === 'faculty') {
    if (type === 'academic') return 'grades'
    if (type === 'attendance') return 'attendance'
    if (type === 'enrollment') return 'roster'
    if (type === 'discipline') return 'guidance-records'
    return 'overview'
  }

  if (type === 'enrollment') return 'enrollment'
  if (type === 'discipline') return 'discipline-records'
  if (type === 'academic') return 'reports'
  return 'overview'
}

function resolveSectionFromLink(link: string, role: UserData['role']) {
  const normalized = link.trim().toLowerCase()

  if (!normalized || normalized === '/') {
    return ''
  }

  try {
    const parsed = new URL(normalized, 'http://localhost')
    const explicitSection = parsed.searchParams.get('section')?.trim().toLowerCase()
    if (explicitSection) {
      return explicitSection
    }

    const dashboardPrefix = `/dashboard/${role}/`
    if (parsed.pathname.startsWith(dashboardPrefix)) {
      return parsed.pathname.slice(dashboardPrefix.length).split('/')[0] || ''
    }
  } catch {
    return ''
  }

  return ''
}

function resolveNotificationSection(notification: NotificationRecord, role: UserData['role']) {
  const sectionFromLink = resolveSectionFromLink(notification.link || '', role)
  if (sectionFromLink) {
    return sectionFromLink
  }

  return resolveSectionFromType(role, notification.type)
}

function resolveNotificationLink(link?: string) {
  const normalized = (link || '').trim()

  if (!normalized || normalized === '/') {
    return ''
  }

  return normalized
}

export function NotificationBell({ currentUser, onNavigateSection }: NotificationBellProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  )

  const fetchNotifications = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/notifications?recipientId=${encodeURIComponent(currentUser.id)}&recipientRole=${encodeURIComponent(currentUser.role)}&limit=10&page=1`
      )
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load notifications.')
      }

      setNotifications(Array.isArray(payload.data) ? payload.data : [])
    } catch {
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    const timer = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => clearInterval(timer)
  }, [currentUser.id, currentUser.role])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update notification.')
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification
        )
      )
    } catch {
      fetchNotifications()
    }
  }

  const onNotificationClick = async (notification: NotificationRecord) => {
    await markAsRead(notification.id)

    const targetSection = resolveNotificationSection(notification, currentUser.role)
    if (targetSection && onNavigateSection) {
      onNavigateSection(targetSection)
    }

    const targetLink = resolveNotificationLink(notification.link)

    if (targetLink) {
      router.push(targetLink)
    }
  }

  const markAllAsRead = async () => {
    setIsMarkingAllRead(true)

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: currentUser.id,
          recipientRole: currentUser.role,
          markAllRead: true,
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to mark notifications read.')
      }

      setNotifications((previous) => previous.map((notification) => ({ ...notification, isRead: true })))
    } catch {
      fetchNotifications()
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && fetchNotifications()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 border-gray-800 bg-gray-950 text-gray-100">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm text-white">Notifications</DropdownMenuLabel>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-gray-300 hover:text-white"
            onClick={markAllAsRead}
            disabled={isMarkingAllRead || unreadCount === 0}
          >
            {isMarkingAllRead ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="mr-2 h-3.5 w-3.5" />}
            Mark all read
          </Button>
        </div>
        <DropdownMenuSeparator className="bg-gray-800" />
        <div className="max-h-96 overflow-y-auto">
          {isLoading && notifications.length === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-400">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-400">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => onNotificationClick(notification)}
                className={`w-full border-b border-gray-900 px-3 py-3 text-left transition-colors hover:bg-gray-900/80 ${notification.isRead ? 'bg-transparent' : 'bg-blue-950/20'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{notification.title}</span>
                      {!notification.isRead && <span className="h-2 w-2 rounded-full bg-blue-400" />}
                    </div>
                    <p className="text-xs text-gray-400">{notification.message}</p>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">{notification.type}</p>
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}