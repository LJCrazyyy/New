'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Calendar, User } from 'lucide-react';

interface CounselingSession {
  id: string;
  sessionDate: string;
  topic: string;
  summary: string;
  nextStep: string;
  counselor?: {
    name?: string;
  };
}

interface CounselingRecordsProps {
  sessions: CounselingSession[];
}

export function CounselingRecords({ sessions }: CounselingRecordsProps) {

  const getReasonColor = (reason: string | undefined) => {
    if (!reason) return 'bg-gray-700/30 text-gray-200 hover:bg-gray-700/50';
    
    switch (reason.toLowerCase()) {
      case 'academic planning':
        return 'bg-blue-900/30 text-blue-200 hover:bg-blue-900/50';
      case 'career guidance':
        return 'bg-purple-900/30 text-purple-200 hover:bg-purple-900/50';
      case 'stress management':
        return 'bg-amber-900/30 text-amber-200 hover:bg-amber-900/50';
      default:
        return 'bg-gray-700/30 text-gray-200 hover:bg-gray-700/50';
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-indigo-400" />
          <div>
            <CardTitle>Guidance & Counseling Records</CardTitle>
            <CardDescription>Session history and notes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border border-gray-700 rounded-lg p-4 bg-gray-900/50 hover:bg-gray-900/80 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-300">{new Date(session.sessionDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-200">{session.counselor?.name ?? 'Counselor'}</span>
                    </div>
                  </div>
                  <Badge className={getReasonColor(session.topic)}>{session.topic}</Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Actions Taken</p>
                  <p className="text-sm text-gray-300">{session.summary}</p>
                </div>

                {session.nextStep && (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Follow-up Date</p>
                    <p className="text-sm text-amber-400">{session.nextStep}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No counseling sessions recorded</p>
        )}
      </CardContent>
    </Card>
  );
}
