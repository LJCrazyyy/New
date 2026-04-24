'use client'

import { GuidanceRecordsFaculty } from './guidance-records'

interface CounselingRecordsFacultyProps {
  facultyId: string
}

export function CounselingRecordsFaculty({ facultyId }: CounselingRecordsFacultyProps) {
  return <GuidanceRecordsFaculty facultyId={facultyId} mode="counseling" />
}
