'use client'

import { useState } from 'react'
import { AdminHeader } from './admin/admin-header'
import { AdminSidebar } from './admin/admin-sidebar'
import { AdminOverview } from './admin/admin-overview'
import { UserManagement } from './admin/user-management'
import { CourseAdminManagement } from './admin/course-admin-management'
import { EnrollmentManagement } from './admin/enrollment-management'
import { AuditLogs } from './admin/audit-logs'
import { SystemSettings } from './admin/system-settings'
import { AdminReports } from './admin/admin-reports'

interface AdminDashboardProps {
  onLogout?: () => void
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState('overview')

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="md:ml-64">
        <AdminHeader onLogout={onLogout} />
        
        <div className="p-4 md:p-8 space-y-6">
          {activeSection === 'overview' && <AdminOverview />}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'courses' && <CourseAdminManagement />}
          {activeSection === 'enrollment' && <EnrollmentManagement />}
          {activeSection === 'audit-logs' && <AuditLogs />}
          {activeSection === 'settings' && <SystemSettings />}
          {activeSection === 'reports' && <AdminReports />}
        </div>
      </main>
    </div>
  )
}
