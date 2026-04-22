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
import { MedicalRecordManagement } from './admin/medical-record-management'
import { DisciplineRecordManagement } from './admin/discipline-record-management'
import type { UserData } from '@/components/login-page'

interface AdminDashboardProps {
  onLogout?: () => void
  currentUser: UserData
}

export function AdminDashboard({ onLogout, currentUser }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState('overview')

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="md:ml-64">
      
        <AdminHeader
          onLogout={onLogout}
          currentUser={currentUser}
          onNavigateSection={setActiveSection}
        />
        
        <div className="p-4 md:p-8 space-y-6">
          {activeSection === 'overview' && <AdminOverview />}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'courses' && <CourseAdminManagement />}
          {activeSection === 'enrollment' && <EnrollmentManagement />}
          {activeSection === 'medical-records' && <MedicalRecordManagement />}
          {activeSection === 'discipline-records' && <DisciplineRecordManagement />}
          {activeSection === 'audit-logs' && <AuditLogs />}
          {activeSection === 'settings' && <SystemSettings />}
          {activeSection === 'reports' && <AdminReports />}
        </div>
      </main>
    </div>
  )
}
