'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RecentGradesProps {
  grades: Array<{
    id: string
    code: string
    name: string
    prelim: number | null
    midterm: number | null
    final: number | null
    average: number | null
    remarks: string
  }>
  progress?: {
    cumulativeGPA?: number
  }
  student?: {
    name?: string
    systemId?: string
  }
  profile?: {
    course?: string
    section?: string
    yearLevel?: string
  } | null
  fullWidth?: boolean
}

export function RecentGrades({ grades, progress, student, profile, fullWidth }: RecentGradesProps) {

  const getGradeColor = (average: number | null) => {
    if (!average) return 'text-muted-foreground'
    if (average >= 90) return 'text-emerald-600'
    if (average >= 85) return 'text-blue-600'
    if (average >= 80) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getGradeBadgeVariant = (remarks: string) => {
    switch (remarks) {
      case 'Excellent':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
      case 'Very Good':
        return 'bg-blue-500/10 text-blue-700 border-blue-200'
      case 'Good':
        return 'bg-blue-500/10 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
  }

  const toDisplayScore = (value: number | null) => {
    return value == null ? '-' : String(value)
  }

  const downloadGradesPdf = async () => {
    const [{ jsPDF }] = await Promise.all([import('jspdf')])
    const document = new jsPDF({ unit: 'pt', format: 'a4' })

    let y = 56
    document.setFont('helvetica', 'bold')
    document.setFontSize(16)
    document.text('Student Grade Report', 40, y)

    y += 20
    document.setFont('helvetica', 'normal')
    document.setFontSize(10)
    document.text(`Generated: ${new Date().toLocaleString()}`, 40, y)

    y += 18
    document.text(`Student: ${student?.name ?? 'N/A'} (${student?.systemId ?? 'N/A'})`, 40, y)
    y += 14
    document.text(`Program: ${profile?.course ?? 'N/A'}`, 40, y)
    y += 14
    document.text(`Section / Year: ${profile?.section ?? 'N/A'} / ${profile?.yearLevel ?? 'N/A'}`, 40, y)
    y += 14
    document.text(`Semester GPA: ${progress?.cumulativeGPA?.toFixed(2) ?? 'N/A'}`, 40, y)

    y += 24
    document.setFont('helvetica', 'bold')
    document.text('Code', 40, y)
    document.text('Subject', 95, y)
    document.text('Prelim', 315, y)
    document.text('Midterm', 365, y)
    document.text('Final', 425, y)
    document.text('Avg', 475, y)
    document.text('Remarks', 520, y)

    y += 10
    document.setLineWidth(0.7)
    document.line(40, y, 560, y)

    y += 16
    document.setFont('helvetica', 'normal')

    for (const grade of grades) {
      if (y > 760) {
        document.addPage()
        y = 56
      }

      const subjectName = grade.name.length > 34 ? `${grade.name.slice(0, 31)}...` : grade.name

      document.text(grade.code, 40, y)
      document.text(subjectName, 95, y)
      document.text(toDisplayScore(grade.prelim), 315, y)
      document.text(toDisplayScore(grade.midterm), 365, y)
      document.text(toDisplayScore(grade.final), 425, y)
      document.text(toDisplayScore(grade.average), 475, y)
      document.text(grade.remarks || '-', 520, y)
      y += 18
    }

    const safeSystemId = student?.systemId ?? 'student'
    const timestamp = new Date().toISOString().slice(0, 10)
    document.save(`${safeSystemId}-grades-${timestamp}.pdf`)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Recent Grades</h3>
        </div>
        <Button variant="outline" className="border-border" onClick={downloadGradesPdf}>
          Download PDF
        </Button>
      </div>

      <div className={`${fullWidth ? 'space-y-3' : 'space-y-3'}`}>
        {grades.map((grade) => (
          <div
            key={grade.id}
            className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">{grade.code}</p>
                <p className="font-semibold text-foreground text-sm">{grade.name}</p>
              </div>
              <Badge variant="outline" className={getGradeBadgeVariant(grade.remarks)}>
                {grade.remarks}
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded bg-background">
                <p className="text-xs text-muted-foreground">Prelim</p>
                <p className="font-bold text-sm text-foreground">{grade.prelim}</p>
              </div>
              <div className="p-2 rounded bg-background">
                <p className="text-xs text-muted-foreground">Midterm</p>
                <p className="font-bold text-sm text-foreground">{grade.midterm}</p>
              </div>
              <div className="p-2 rounded bg-background">
                <p className="text-xs text-muted-foreground">Final</p>
                <p className={`font-bold text-sm ${grade.final ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {grade.final || '-'}
                </p>
              </div>
              <div className="p-2 rounded bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground">Average</p>
                <p className={`font-bold text-sm ${getGradeColor(grade.average)}`}>
                  {grade.average || '-'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {fullWidth && (
        <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
          <p className="text-sm text-muted-foreground">
            Overall GPA This Semester:{' '}
            <span className="font-semibold text-foreground">{progress?.cumulativeGPA?.toFixed(2) ?? 'N/A'}</span>
          </p>
        </div>
      )}
    </Card>
  )
}
