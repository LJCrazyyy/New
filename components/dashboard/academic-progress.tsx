'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingUp } from 'lucide-react'

interface AcademicProgressProps {
  progress?: {
    cumulativeGPA: number
    totalUnitsRequired: number
    totalUnitsCompleted: number
    coreUnitsCompleted: number
    electiveUnitsCompleted: number
    status: string
    currentYear: number
    currentSemester: number | string
    alerts: string
  }
}

export function AcademicProgress({ progress }: AcademicProgressProps) {
  const tracker = {
    cumulativeGPA: progress?.cumulativeGPA ?? 0,
    totalUnitsRequired: progress?.totalUnitsRequired ?? 120,
    totalUnitsCompleted: progress?.totalUnitsCompleted ?? 0,
    coreUnitsCompleted: progress?.coreUnitsCompleted ?? 0,
    electiveUnitsCompleted: progress?.electiveUnitsCompleted ?? 0,
    status: progress?.status ?? 'No Data',
    currentYear: progress?.currentYear ?? 1,
    currentSemester: progress?.currentSemester ?? 'Current Semester',
    alerts: progress?.alerts ?? 'No active alerts.',
  }

  const progressPercentage = (tracker.totalUnitsCompleted / tracker.totalUnitsRequired) * 100

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Academic Progress</h3>

          <div className="space-y-4">
            {/* GPA Display */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div>
                <p className="text-sm text-muted-foreground">Cumulative GPA</p>
                <p className="text-2xl font-bold text-foreground">{tracker.cumulativeGPA}</p>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>

            {/* Units Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">Units Completed</p>
                <p className="text-sm text-muted-foreground">
                  {tracker.totalUnitsCompleted} / {tracker.totalUnitsRequired}
                </p>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {progressPercentage.toFixed(0)}% of degree completed
              </p>
            </div>

            {/* Core vs Elective */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                <p className="text-xs text-muted-foreground">Core Units</p>
                <p className="text-xl font-bold text-foreground">{tracker.coreUnitsCompleted}</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                <p className="text-xs text-muted-foreground">Elective Units</p>
                <p className="text-xl font-bold text-foreground">{tracker.electiveUnitsCompleted}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">Academic Status</p>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                {tracker.status}
              </Badge>
            </div>

            {/* Semester Info */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Current Year</p>
                <p className="text-lg font-semibold text-foreground">Year {tracker.currentYear}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Semester</p>
                <p className="text-lg font-semibold text-foreground">{tracker.currentSemester}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-200/30">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-600">{tracker.alerts}</p>
        </div>
      </div>
    </Card>
  )
}
