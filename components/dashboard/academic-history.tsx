'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-rose-400" />
          <div>
            <CardTitle>Academic History</CardTitle>
            <CardDescription>Timeline of academic activities and milestones</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, idx) => (
              <div key={activity.id} className="flex gap-4">
                {/* Timeline line */}
                {idx !== activities.length - 1 && (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="w-0.5 h-12 bg-gray-700 mt-2" />
                  </div>
                )}
                {idx === activities.length - 1 && (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                )}

                {/* Activity content */}
                <div className="flex-1 pt-1 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{activity.description}</h4>
                    <Badge className={getActivityColor(activity.type)}>{getTypeLabel(activity.type)}</Badge>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">{new Date(activity.recordedAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-300">{activity.details}</p>
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
