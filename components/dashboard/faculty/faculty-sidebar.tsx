import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  TrendingUp,
  CheckSquare,
  BookUser,
  HeartPulse,
} from 'lucide-react'

interface FacultySidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  facultyName?: string
  department?: string
}

export function FacultySidebar({ activeSection, onSectionChange, facultyName, department }: FacultySidebarProps) {
  const sections = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'grades', label: 'Grade Entry', icon: FileText },
    { id: 'roster', label: 'Class Roster', icon: Users },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare },
    { id: 'guidance-records', label: 'Guidance Records', icon: BookUser },
    { id: 'medical-records', label: 'Medical Records', icon: HeartPulse },
  ]

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-gray-900 border-r border-gray-800 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white">Faculty Portal</h1>
        <p className="text-sm text-gray-400">Academic Management</p>
      </div>

      <nav className="flex-1 space-y-2 px-4 overflow-y-auto">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id

          return (
            <button
              key={section.id}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-purple-900/50 text-purple-200 border border-purple-700'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              onClick={() => onSectionChange(section.id)}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{section.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400">
          <p className="font-semibold text-white mb-1">{facultyName ?? 'Faculty Member'}</p>
          <p>{department ?? 'Department'}</p>
        </div>
      </div>
    </aside>
  )
}
