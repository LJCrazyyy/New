'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
import { StudentProfileManagement } from './admin/student-profile-management'
import { FacultyProfileManagement } from './admin/faculty-profile-management'
import { StudentDocumentManagement } from './admin/student-document-management'
import { StudentOrganizationManagement } from './admin/student-organization-management'
import { AcademicHistoryManagement } from './admin/academic-history-management'
import { AttendanceManagement } from './admin/attendance-management'
import { GradeScaleManagement } from './admin/grade-scale-management'
import { CoursePrerequisiteManagement } from './admin/course-prerequisite-management'
import type { UserData } from '@/components/login-page'

interface AdminDashboardProps {
  onLogout?: () => void
  currentUser: UserData
}

export function AdminDashboard({ onLogout, currentUser }: AdminDashboardProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const validSections = useMemo(
    () => [
      'overview',
      'users',
      'student-profiles',
      'faculty-profiles',
      'courses',
      'enrollment',
      'documents',
      'organizations',
      'academic-history',
      'attendance',
      'grade-scales',
      'course-prerequisites',
      'medical-records',
      'discipline-records',
      'audit-logs',
      'reports',
      'settings',
    ],
    []
  )

  const querySection = searchParams.get('section')?.trim().toLowerCase() ?? ''
  const initialSection = validSections.includes(querySection) ? querySection : 'overview'

  const [activeSection, setActiveSection] = useState(initialSection)

  const updateSection = (section: string) => {
    if (section === activeSection) {
      return
    }

    setActiveSection(section)
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', section)
    router.push(`${pathname}?${params.toString()}`)
  }

  useEffect(() => {
    if (querySection && validSections.includes(querySection) && querySection !== activeSection) {
      setActiveSection(querySection)
    } else if (!querySection && activeSection !== 'overview') {
      setActiveSection('overview')
    }
  }, [querySection, activeSection, validSections])

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar activeSection={activeSection} onSectionChange={updateSection} />
      
      <main className="md:ml-64">
      
        <AdminHeader
          onLogout={onLogout}
          currentUser={currentUser}
          onNavigateSection={updateSection}
        />
        
        <div className="p-4 md:p-8 space-y-6">
          {activeSection === 'overview' && <AdminOverview />}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'student-profiles' && <StudentProfileManagement />}
          {activeSection === 'faculty-profiles' && <FacultyProfileManagement />}
          {activeSection === 'courses' && <CourseAdminManagement />}
          {activeSection === 'enrollment' && <EnrollmentManagement />}
          {activeSection === 'documents' && <StudentDocumentManagement />}
          {activeSection === 'organizations' && <StudentOrganizationManagement />}
          {activeSection === 'academic-history' && <AcademicHistoryManagement />}
          {activeSection === 'attendance' && <AttendanceManagement />}
          {activeSection === 'grade-scales' && <GradeScaleManagement />}
          {activeSection === 'course-prerequisites' && <CoursePrerequisiteManagement />}
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
