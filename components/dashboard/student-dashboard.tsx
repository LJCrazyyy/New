'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
import { AllActivities } from './all-activities'
import { Sidebar } from './sidebar'
import type { UserData } from '@/components/login-page'

interface StudentDashboardProps {
  currentUser: UserData
  onLogout?: () => void
}

type StudentDashboardData = {
  student: {
    id: string
    name: string
    email: string
    systemId: string
  }
  profile: {
    studentNumber: string
    course: string
    section: string
    yearLevel: string
    admissionDate?: string
  } | null
  progress: {
    cumulativeGPA: number
    totalUnitsRequired: number
    totalUnitsCompleted: number
    totalUnitsEnrolled: number
    coreUnitsCompleted: number
    electiveUnitsCompleted: number
    status: string
    currentYear: number
    currentSemester: string | number
    alerts: string
  }
  currentCourses: Array<{
    id: string
    code: string
    name: string
    instructor: string
    schedule: string
    room: string
    units: number
    status: string
  }>
  activityCourses: Array<{
    id: string
    code: string
    name: string
    instructor: string
    schedule: string
    room: string
    units: number
    status: string
  }>
  recentGrades: Array<{
    id: string
    code: string
    name: string
    prelim: number | null
    midterm: number | null
    final: number | null
    average: number | null
    remarks: string
  }>
  academicHistory: Array<{
    id: string
    recordedAt: string
    type: 'enrollment' | 'grade-change' | 'status-change' | 'milestone'
    description: string
    details: string
  }>
  medicalRecords: Array<{
    id: string
    title: string
    category: string
    notes: string
    status?: string
    recordedAt: string
  }>
  counselingRecords: Array<{
    id: string
    sessionDate: string
    topic: string
    summary: string
    nextStep: string
    counselor?: {
      name?: string
    }
  }>
  disciplineRecords: Array<{
    id: string
    incidentDate: string
    incident: string
    severity: string
    actionTaken: string
    status: string
  }>
  documents: Array<{
    id: string
    title: string
    category: string
    fileName: string
    fileUrl: string
    status: string
    createdAt: string
  }>
  organizations: Array<{
    id: string
    organizationName: string
    role: string
    joinedAt: string
    status: string
  }>
}

export function StudentDashboard({ currentUser, onLogout }: StudentDashboardProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const validSections = useMemo(
    () => [
      'overview',
      'courses',
      'activities',
      'grades',
      'health',
      'counseling',
      'discipline',
      'organizations',
      'documents',
    ],
    []
  )

  const querySection = searchParams.get('section')?.trim().toLowerCase() ?? ''
  const queryCourse = searchParams.get('course')?.trim() ?? ''
  const initialSection = validSections.includes(querySection) ? querySection : 'overview'

  const [activeSection, setActiveSection] = useState(initialSection)
  const [data, setData] = useState<StudentDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const updateSection = (section: string) => {
    if (section === activeSection) {
      return
    }

    setActiveSection(section)
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', section)

    if (section !== 'activities') {
      params.delete('course')
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  useEffect(() => {
    if (querySection && validSections.includes(querySection) && querySection !== activeSection) {
      setActiveSection(querySection)
    } else if (!querySection && activeSection !== 'overview') {
      setActiveSection('overview')
    }
  }, [querySection, activeSection, validSections])

  useEffect(() => {
    let mounted = true

    async function loadDashboardData() {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`/api/dashboard/student/${currentUser.id}`)
        const payload = await response.json()

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Unable to load student dashboard data.')
        }

        if (mounted) {
          setData(payload.data as StudentDashboardData)
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load student dashboard data.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      mounted = false
    }
  }, [currentUser.id])

  return (
    <div className="dark min-h-screen bg-gray-950 text-white">
      <Sidebar activeSection={activeSection} onSectionChange={updateSection} />
      
      <main className="md:ml-64">
        <StudentHeader
          onLogout={onLogout}
          currentUser={currentUser}
          onNavigateSection={updateSection}
        />
        
        <div className="p-4 md:p-8 space-y-6">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {isLoading && <p className="text-sm text-muted-foreground">Loading student dashboard...</p>}

          {activeSection === 'overview' && (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                  <StudentProfile student={data?.student} profile={data?.profile} />
                </div>
                <div className="md:col-span-2">
                  <AcademicProgress progress={data?.progress} />
                </div>
              </div>
              
              <div className="grid gap-6 lg:grid-cols-2">
                <CurrentCourses courses={data?.currentCourses ?? []} studentId={currentUser.id} />
                <RecentGrades grades={data?.recentGrades ?? []} progress={data?.progress} student={data?.student} profile={data?.profile} />
              </div>
            </>
          )}
          
          {activeSection === 'courses' && <CurrentCourses courses={data?.currentCourses ?? []} studentId={currentUser.id} />}
            {activeSection === 'activities' && !queryCourse && <AllActivities courses={data?.currentCourses ?? []} studentId={currentUser.id} />}
            {activeSection === 'activities' && queryCourse && <CurrentCourses courses={data?.currentCourses ?? []} studentId={currentUser.id} fullWidth initialCourseId={queryCourse} />}
          {activeSection === 'grades' && <RecentGrades grades={data?.recentGrades ?? []} progress={data?.progress} student={data?.student} profile={data?.profile} fullWidth />}
          {activeSection === 'health' && <MedicalRecords studentId={currentUser.id} records={data?.medicalRecords ?? []} />}
          {activeSection === 'counseling' && <CounselingRecords studentId={currentUser.id} sessions={data?.counselingRecords ?? []} />}
          {activeSection === 'discipline' && <DisciplineRecords studentId={currentUser.id} records={data?.disciplineRecords ?? []} />}
          {activeSection === 'organizations' && <StudentOrganizations studentId={currentUser.id} organizations={data?.organizations ?? []} />}
          {activeSection === 'documents' && <StudentDocuments studentId={currentUser.id} documents={data?.documents ?? []} />}
        </div>
      </main>
    </div>
  )
}
