'use client'

import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  LogOut, 
  Heart, 
  MessageCircle, 
  AlertTriangle, 
  Users, 
  FileCheck,
  History
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const sections = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'grades', label: 'Grades', icon: FileText },
    { id: 'academic-history', label: 'Academic History', icon: History },
    { id: 'health', label: 'Medical Records', icon: Heart },
    { id: 'counseling', label: 'Counseling', icon: MessageCircle },
    { id: 'discipline', label: 'Discipline Records', icon: AlertTriangle },
    { id: 'organizations', label: 'Organizations', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileCheck },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-gray-800 bg-gray-900 p-4 hidden md:flex flex-col">
      <div className="mb-8">
        <div className="flex items-center gap-2 px-2 py-3 rounded-lg bg-gray-800">
          <div className="h-8 w-8 rounded-full bg-cyan-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">SD</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-white">Student Portal</p>
            <p className="text-xs text-gray-400">v1.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id

          return (
            <button
              key={section.id}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-900/50 text-cyan-200 border border-cyan-700'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              onClick={() => {
                console.log('[v0] Clicking section:', section.id)
                onSectionChange(section.id)
              }}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{section.label}</span>
            </button>
          )
        })}
      </nav>

    </aside>
  )
}
