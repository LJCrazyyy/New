'use client'

import { Bell, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StudentHeaderProps {
  onLogout?: () => void
}

export function StudentHeader({ onLogout }: StudentHeaderProps) {
  const handleLogoutClick = () => {
    console.log('[v0] Logout button clicked')
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="flex items-center justify-between p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back! Here's your academic overview.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLogoutClick}
            title="Logout"
            className="cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
