'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Calendar, User } from 'lucide-react';

interface CounselingSession {
  id: string;
  date: string;
  counselorName: string;
  reason: string;
  actionsTaken: string;
  followUpDate: string | null;
}

export function CounselingRecords() {
  const sessions: CounselingSession[] = [
    {
      id: '1',
      date: 'March 10, 2024',
      counselorName: 'Ms. Sarah Johnson',
      reason: 'Academic Planning',
      actionsTaken: 'Discussed course selection for next semester',
      followUpDate: 'April 15, 2024',
    },
    {
      id: '2',
      date: 'February 28, 2024',
      counselorName: 'Mr. David Lee',
      reason: 'Stress Management',
      actionsTaken: 'Introduced stress management techniques and resources',
      followUpDate: null,
    },
    {
      id: '3',
      date: 'January 22, 2024',
      counselorName: 'Ms. Sarah Johnson',
      reason: 'Career Guidance',
      actionsTaken: 'Reviewed career options and internship opportunities',
      followUpDate: 'March 5, 2024',
    },
  ];

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
                      <span className="text-sm text-gray-300">{session.date}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-200">{session.counselorName}</span>
                    </div>
                  </div>
                  <Badge className={getReasonColor()}>{session.reason}</Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Actions Taken</p>
                  <p className="text-sm text-gray-300">{session.actionsTaken}</p>
                </div>

                {session.followUpDate && (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Follow-up Date</p>
                    <p className="text-sm text-amber-400">{session.followUpDate}</p>
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
