'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3 } from 'lucide-react'

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
  fullWidth?: boolean
}

export function RecentGrades({ grades, progress, fullWidth }: RecentGradesProps) {

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

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Recent Grades</h3>
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
