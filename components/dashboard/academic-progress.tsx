'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingUp } from 'lucide-react'

export function AcademicProgress() {
  // Mock academic data
  const tracker = {
    cumulativeGPA: 3.45,
    totalUnitsRequired: 120,
    totalUnitsCompleted: 45,
    coreUnitsCompleted: 30,
    electiveUnitsCompleted: 15,
    status: 'On Track',
    currentYear: 2,
    currentSemester: 1,
    alerts: 'No active alerts',
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
                <p className="text-lg font-semibold text-foreground">Semester {tracker.currentSemester}</p>
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
