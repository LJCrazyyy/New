'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface DisciplineIncident {
  id: string;
  incidentDate: string;
  incident: string;
  severity: string;
  actionTaken: string;
  status: string;
}

interface DisciplineRecordsProps {
  studentId: string;
  records?: DisciplineIncident[];
}

export function DisciplineRecords({ studentId, records: providedRecords }: DisciplineRecordsProps) {
  const [incidents, setIncidents] = useState<DisciplineIncident[]>(providedRecords ?? []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (providedRecords) {
      setIncidents(providedRecords);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function loadDisciplineRecords() {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/discipline-records?student=${studentId}&limit=100&sort=incidentDate&order=desc`);
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Unable to load discipline records.');
        }

        if (mounted) {
          setIncidents(Array.isArray(payload.data) ? payload.data : []);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load discipline records.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    if (studentId) {
      loadDisciplineRecords();
    }

    return () => {
      mounted = false;
    };
  }, [providedRecords, studentId]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'bg-green-900/30 text-green-200 hover:bg-green-900/50';
      case 'pending':
        return 'bg-amber-900/30 text-amber-200 hover:bg-amber-900/50';
      case 'in-progress':
      case 'open':
        return 'bg-blue-900/30 text-blue-200 hover:bg-blue-900/50';
      default:
        return 'bg-gray-700/30 text-gray-200 hover:bg-gray-700/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in-progress':
      case 'open':
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
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400 mb-4">Loading discipline records...</p>}

        {incidents.length > 0 ? (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="border border-gray-700 rounded-lg p-4 bg-gray-900/50 hover:bg-gray-900/80 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">{new Date(incident.incidentDate).toLocaleDateString()}</p>
                    <h4 className="font-semibold text-white mb-2">{incident.incident}</h4>
                    <p className="text-sm text-gray-300">Severity: {incident.severity}</p>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-3 mt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Action Taken</p>
                  <p className="text-sm text-gray-200 mb-3">{incident.actionTaken}</p>

                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-400 uppercase">Status</p>
                    <Badge className={`${getStatusColor(incident.status)} flex items-center gap-1`}>
                      {getStatusIcon(incident.status)}
                      {incident.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoading && <p className="text-sm text-gray-400">No discipline records on file</p>
        )}
      </CardContent>
    </Card>
  );
}
