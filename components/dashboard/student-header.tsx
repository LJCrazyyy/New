'use client'

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/dashboard/notification-bell'
import type { UserData } from '@/components/login-page'

interface StudentHeaderProps {
  onLogout?: () => void
  currentUser: UserData
  onNavigateSection?: (section: string) => void
}

export function StudentHeader({ onLogout, currentUser, onNavigateSection }: StudentHeaderProps) {
  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
      <div className="flex items-center justify-between p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Student Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome back! Here is your academic overview.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <NotificationBell currentUser={currentUser} onNavigateSection={onNavigateSection} />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLogoutClick}
            title="Logout"
            className="cursor-pointer text-gray-400 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
