'use client'

import { Search, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NotificationBell } from '@/components/dashboard/notification-bell'
import type { UserData } from '@/components/login-page'

interface AdminHeaderProps {
  onLogout?: () => void
  currentUser: UserData
  onNavigateSection?: (section: string) => void
}

export function AdminHeader({ onLogout, currentUser, onNavigateSection }: AdminHeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
      <div className="flex items-center justify-between p-4 md:p-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search users, courses..."
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell currentUser={currentUser} onNavigateSection={onNavigateSection} />
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <Settings className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-white"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
