'use client'

import { useEffect, useState } from 'react'
import { FacultyHeader } from './faculty/faculty-header'
import { FacultySidebar } from './faculty/faculty-sidebar'
import { FacultyProfile } from './faculty/faculty-profile'
import { CourseManagement } from './faculty/course-management'
import { GradeEntry } from './faculty/grade-entry'
import { ClassRoster } from './faculty/class-roster'
import { StudentPerformance } from './faculty/student-performance'
import { AttendanceTracking } from './faculty/attendance-tracking'
import { CourseActivities } from './faculty/course-activities'
import { GuidanceRecordsFaculty } from './faculty/guidance-records'
import { CounselingRecordsFaculty } from './faculty/counseling-records-faculty'
import { MedicalRecordsFaculty } from './faculty/medical-records'
import type { UserData } from '@/components/login-page'

interface FacultyDashboardProps {
  currentUser: UserData
  onLogout?: () => void
}

type FacultyDashboardData = {
  faculty: {
    id: string
    name: string
    email: string
    systemId: string
    status: string
  }
  profile: {
    employeeNumber?: string
    department?: string
    title?: string
    office?: string
    coursesAssigned?: Array<{ id: string }>
  } | null
  assignedCourses: Array<{
    id: string
    code: string
    name: string
    section: string
    schedule: string
    room: string
    enrolledCount: number
    units: number
    semester: string
  }>
  classRoster: Array<{
    id: string
    name: string
    email: string
    year: string
    status: string
    average: number | null
  }>
  studentPerformance: Array<{
    id: string
    name: string
    average: number
    status: string
    year: number
  }>
  enrollments: Array<{
    id: string
    prelim: number | null
    midterm: number | null
    final: number | null
    average: number | null
    student?: {
      id?: string
      systemId?: string
      name?: string
      email?: string
    }
    course?: {
      id?: string
      code?: string
      name?: string
      section?: string
      semester?: string
    }
  }>
}

export function FacultyDashboard({ currentUser, onLogout }: FacultyDashboardProps) {
  const [activeSection, setActiveSection] = useState('overview')
  const [data, setData] = useState<FacultyDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadFacultyData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/dashboard/faculty/${currentUser.id}`)
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to load faculty dashboard data.')
      }

      setData(payload.data as FacultyDashboardData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load faculty dashboard data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFacultyData()
  }, [currentUser.id])

  return (
    <div className="min-h-screen bg-background">
      <FacultySidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        facultyName={data?.faculty?.name}
        department={data?.profile?.department}
      />
      
      <main className="md:ml-64">
        <FacultyHeader
          onLogout={onLogout}
          currentUser={currentUser}
          onNavigateSection={setActiveSection}
        />
        
        <div className="p-4 md:p-8 space-y-6">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {isLoading && <p className="text-sm text-gray-400">Loading faculty dashboard...</p>}

          {activeSection === 'overview' && (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                  <FacultyProfile faculty={data?.faculty} profile={data?.profile} />
                </div>
                <div className="md:col-span-2">
                  <CourseManagement courses={data?.assignedCourses ?? []} />
                </div>
              </div>
            </>
          )}
          
          {activeSection === 'courses' && <CourseManagement courses={data?.assignedCourses ?? []} fullWidth />}
          {activeSection === 'activities' && (
            <CourseActivities
              facultyId={currentUser.id}
              courses={data?.assignedCourses ?? []}
              enrollments={data?.enrollments ?? []}
            />
          )}
          {activeSection === 'grades' && (
            <GradeEntry
              courses={data?.assignedCourses ?? []}
              enrollments={data?.enrollments ?? []}
              onRefresh={loadFacultyData}
            />
          )}
          {activeSection === 'roster' && <ClassRoster courses={data?.assignedCourses ?? []} enrollments={data?.enrollments ?? []} />}
          {activeSection === 'performance' && <StudentPerformance performance={data?.studentPerformance ?? []} />}
          {activeSection === 'attendance' && (
            <AttendanceTracking
              facultyId={currentUser.id}
              courses={data?.assignedCourses ?? []}
              enrollments={data?.enrollments ?? []}
            />
          )}
          {activeSection === 'guidance-records' && <GuidanceRecordsFaculty facultyId={currentUser.id} mode="guidance" />}
          {activeSection === 'counseling-records' && <CounselingRecordsFaculty facultyId={currentUser.id} />}
          {activeSection === 'medical-records' && <MedicalRecordsFaculty facultyId={currentUser.id} />}
        </div>
      </main>
    </div>
  )
}
