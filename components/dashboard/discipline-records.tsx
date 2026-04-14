'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface DisciplineIncident {
  id: string;
  date: string;
  offense: string;
  description: string;
  action: string;
  resolutionStatus: 'Resolved' | 'Pending' | 'In Progress';
}

export function DisciplineRecords() {
  const incidents: DisciplineIncident[] = [
    {
      id: '1',
      date: 'March 1, 2024',
      offense: 'Minor Code of Conduct Violation',
      description: 'Noise complaint in dormitory after quiet hours',
      action: 'Warning issued',
      resolutionStatus: 'Resolved',
    },
    {
      id: '2',
      date: 'January 15, 2024',
      offense: 'Attendance Violation',
      description: 'Excessive absences in class (more than 10)',
      action: 'Meeting with academic advisor scheduled',
      resolutionStatus: 'Resolved',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
        return 'bg-green-900/30 text-green-200 hover:bg-green-900/50';
      case 'Pending':
        return 'bg-amber-900/30 text-amber-200 hover:bg-amber-900/50';
      case 'In Progress':
        return 'bg-blue-900/30 text-blue-200 hover:bg-blue-900/50';
      default:
        return 'bg-gray-700/30 text-gray-200 hover:bg-gray-700/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'In Progress':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <CardTitle>Discipline Records</CardTitle>
            <CardDescription>Incident history and resolutions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {incidents.length > 0 ? (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="border border-gray-700 rounded-lg p-4 bg-gray-900/50 hover:bg-gray-900/80 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">{incident.date}</p>
                    <h4 className="font-semibold text-white mb-2">{incident.offense}</h4>
                    <p className="text-sm text-gray-300">{incident.description}</p>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-3 mt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Action Taken</p>
                  <p className="text-sm text-gray-200 mb-3">{incident.action}</p>

                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-400 uppercase">Status</p>
                    <Badge className={`${getStatusColor(incident.resolutionStatus)} flex items-center gap-1`}>
                      {getStatusIcon(incident.resolutionStatus)}
                      {incident.resolutionStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No discipline records on file</p>
        )}
      </CardContent>
    </Card>
  );
}
