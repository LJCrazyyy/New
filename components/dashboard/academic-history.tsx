'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, Zap } from 'lucide-react';

interface AcademicActivity {
  id: string;
  recordedAt: string;
  type: 'enrollment' | 'grade-change' | 'status-change' | 'milestone';
  description: string;
  details: string;
}

interface AcademicHistoryProps {
  activities: AcademicActivity[];
}

export function AcademicHistory({ activities }: AcademicHistoryProps) {
  const activitiesByYear = useMemo(() => {
    return activities.reduce<Record<string, AcademicActivity[]>>((groups, activity) => {
      const year = new Date(activity.recordedAt).getFullYear().toString();
      if (!groups[year]) {
        groups[year] = [];
      }

      groups[year].push(activity);
      return groups;
    }, {});
  }, [activities]);

  const sortedYears = Object.keys(activitiesByYear).sort((left, right) => Number(right) - Number(left));

  const getTypeLabel = (type: AcademicActivity['type']) => {
    switch (type) {
      case 'enrollment':
        return 'Enrollment';
      case 'grade-change':
        return 'Grade Change';
      case 'status-change':
        return 'Status Change';
      case 'milestone':
        return 'Milestone';
      default:
        return 'Activity';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'enrollment':
        return 'bg-blue-900/30 text-blue-200 hover:bg-blue-900/50';
      case 'grade-change':
        return 'bg-green-900/30 text-green-200 hover:bg-green-900/50';
      case 'status-change':
        return 'bg-amber-900/30 text-amber-200 hover:bg-amber-900/50';
      case 'milestone':
        return 'bg-purple-900/30 text-purple-200 hover:bg-purple-900/50';
      default:
        return 'bg-gray-700/30 text-gray-200 hover:bg-gray-700/50';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return <BookOpen className="h-4 w-4" />;
      case 'grade-change':
        return <TrendingUp className="h-4 w-4" />;
      case 'milestone':
        return <Zap className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-rose-400" />
          <div>
            <CardTitle>Academic History</CardTitle>
            <CardDescription>Timeline of academic activities and milestones</CardDescription>
          </div>
          </div>
          <Button variant="outline" className="border-gray-700 text-gray-200 hover:bg-gray-800" onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-6">
            {sortedYears.map((year) => (
              <div key={year} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-white">{year}</h4>
                  <Badge className="bg-gray-700/30 text-gray-200 hover:bg-gray-700/50">{activitiesByYear[year].length} activities</Badge>
                </div>
                <div className="space-y-4 border-l border-gray-700 pl-4">
                  {activitiesByYear[year].map((activity) => (
                    <div key={activity.id} className="relative pl-6">
                      <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-rose-400" />
                      <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <h4 className="font-semibold text-white">{activity.description}</h4>
                          <Badge className={getActivityColor(activity.type)}>{getTypeLabel(activity.type)}</Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{new Date(activity.recordedAt).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-300 leading-6">{activity.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No academic history available</p>
        )}
      </CardContent>
    </Card>
  );
}
