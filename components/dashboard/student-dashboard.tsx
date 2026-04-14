'use client'

import { useState } from 'react'
import { StudentHeader } from './student-header'
import { StudentProfile } from './student-profile'
import { AcademicProgress } from './academic-progress'
import { CurrentCourses } from './current-courses'
import { RecentGrades } from './recent-grades'
import { MedicalRecords } from './medical-records'
import { CounselingRecords } from './counseling-records'
import { DisciplineRecords } from './discipline-records'
import { StudentOrganizations } from './student-organizations'
import { StudentDocuments } from './student-documents'
import { AcademicHistory } from './academic-history'
import { Sidebar } from './sidebar'

interface StudentDashboardProps {
  onLogout?: () => void
}

export function StudentDashboard({ onLogout }: StudentDashboardProps) {
  const [activeSection, setActiveSection] = useState('overview')

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="md:ml-64">
        <StudentHeader onLogout={onLogout} />
        
        <div className="p-4 md:p-8 space-y-6">
          {activeSection === 'overview' && (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                  <StudentProfile />
                </div>
                <div className="md:col-span-2">
                  <AcademicProgress />
                </div>
              </div>
              
              <div className="grid gap-6 lg:grid-cols-2">
                <CurrentCourses />
                <RecentGrades />
              </div>
            </>
          )}
          
          {activeSection === 'courses' && <CurrentCourses />}
          {activeSection === 'grades' && <RecentGrades />}
          {activeSection === 'academic-history' && <AcademicHistory />}
          {activeSection === 'health' && <MedicalRecords />}
          {activeSection === 'counseling' && <CounselingRecords />}
          {activeSection === 'discipline' && <DisciplineRecords />}
          {activeSection === 'organizations' && <StudentOrganizations />}
          {activeSection === 'documents' && <StudentDocuments />}
        </div>
      </main>
    </div>
  )
}
