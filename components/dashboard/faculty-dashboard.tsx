'use client'

import { useState } from 'react'
import { FacultyHeader } from './faculty/faculty-header'
import { FacultySidebar } from './faculty/faculty-sidebar'
import { FacultyProfile } from './faculty/faculty-profile'
import { CourseManagement } from './faculty/course-management'
import { GradeEntry } from './faculty/grade-entry'
import { ClassRoster } from './faculty/class-roster'
import { StudentPerformance } from './faculty/student-performance'
import { AttendanceTracking } from './faculty/attendance-tracking'

interface FacultyDashboardProps {
  onLogout?: () => void
}

export function FacultyDashboard({ onLogout }: FacultyDashboardProps) {
  const [activeSection, setActiveSection] = useState('overview')

  return (
    <div className="min-h-screen bg-background">
      <FacultySidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="md:ml-64">
        <FacultyHeader onLogout={onLogout} />
        
        <div className="p-4 md:p-8 space-y-6">
          {activeSection === 'overview' && (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                  <FacultyProfile />
                </div>
                <div className="md:col-span-2">
                  <CourseManagement />
                </div>
              </div>
            </>
          )}
          
          {activeSection === 'courses' && <CourseManagement />}
          {activeSection === 'grades' && <GradeEntry />}
          {activeSection === 'roster' && <ClassRoster />}
          {activeSection === 'performance' && <StudentPerformance />}
          {activeSection === 'attendance' && <AttendanceTracking />}
        </div>
      </main>
    </div>
  )
}
