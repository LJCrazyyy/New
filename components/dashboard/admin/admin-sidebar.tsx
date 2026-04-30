import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCheck,
  FileText,
  Settings,
  BarChart3,
  HeartPulse,
  AlertTriangle,
  UserCog,
  GraduationCap,
  FileCheckIcon,
  Users2,
  BookMarked,
  Clock,
  Percent,
  GitBranch,
} from 'lucide-react'

interface AdminSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const sections = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'student-profiles', label: 'Student Profiles', icon: GraduationCap },
    { id: 'faculty-profiles', label: 'Faculty Profiles', icon: UserCog },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'enrollment', label: 'Enrollment', icon: UserCheck },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'grade-scales', label: 'Grade Scales', icon: Percent },
    { id: 'course-prerequisites', label: 'Course Prerequisites', icon: GitBranch },
    { id: 'documents', label: 'Student Documents', icon: FileCheckIcon },
    { id: 'organizations', label: 'Organizations', icon: Users2 },
    { id: 'medical-records', label: 'Medical Records', icon: HeartPulse },
    { id: 'discipline-records', label: 'Discipline Records', icon: AlertTriangle },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-gray-900 border-r border-gray-800 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        <p className="text-sm text-gray-400">System Administration</p>
      </div>

      <nav className="flex-1 space-y-2 px-4 overflow-y-auto">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id

          return (
            <Link
              key={section.id}
              href={`/?section=${encodeURIComponent(section.id)}`}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber-900/50 text-amber-200 border border-amber-700'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              onClick={() => onSectionChange(section.id)}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{section.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400">
          <p className="font-semibold text-white mb-1">Admin Account</p>
          <p>System Administrator</p>
        </div>
      </div>
    </aside>
  )
}
