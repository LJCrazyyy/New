'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Heart, Pill, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MedicalRecordItem {
  id: string;
  title: string;
  category: string;
  notes: string;
  status?: string;
  recordedAt: string;
}

interface MedicalRecordsProps {
  studentId: string;
  records?: MedicalRecordItem[];
}

export function MedicalRecords({ studentId, records: providedRecords }: MedicalRecordsProps) {
  const [records, setRecords] = useState<MedicalRecordItem[]>(providedRecords ?? []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (providedRecords) {
      setRecords(providedRecords);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function loadMedicalRecords() {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/medical-records?student=${studentId}&limit=100&sort=recordedAt&order=desc`);
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Unable to load medical records.');
        }

        if (mounted) {
          setRecords(Array.isArray(payload.data) ? payload.data : []);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load medical records.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    if (studentId) {
      loadMedicalRecords();
    }

    return () => {
      mounted = false;
    };
  }, [providedRecords, studentId]);

  const groupedInfo = useMemo(() => {
    const allergies = records.filter((record) => record.category.toLowerCase().includes('allerg')).map((record) => record.title);
    const conditions = records.filter((record) => record.category.toLowerCase().includes('condition')).map((record) => record.title);
    const medications = records.filter((record) => record.category.toLowerCase().includes('medication')).map((record) => record.notes);

    return {
      allergies,
      conditions,
      medications,
      latestRecordDate: records[0]?.recordedAt,
    };
  }, [records]);

  const statusTone = (status?: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'active':
        return 'bg-red-900/30 text-red-100 border-red-800/60';
      case 'resolved':
        return 'bg-emerald-900/30 text-emerald-100 border-emerald-800/60';
      case 'archived':
        return 'bg-slate-800 text-slate-100 border-slate-700';
      default:
        return 'bg-gray-800 text-gray-100 border-gray-700';
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          <div>
            <CardTitle>Medical Records</CardTitle>
            <CardDescription>Health and medical information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading medical records...</p>}
        {!isLoading && !error && records.length === 0 && (
          <p className="text-sm text-gray-400">No medical records on file.</p>
        )}

        {!isLoading && !error && records.length > 0 && (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
                <p className="text-xs uppercase tracking-wide text-red-200/80">Allergies</p>
                <p className="mt-2 text-2xl font-bold text-white">{groupedInfo.allergies.length}</p>
                <p className="text-sm text-red-100/70">Known allergy-related entries</p>
              </div>
              <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4">
                <p className="text-xs uppercase tracking-wide text-blue-200/80">Conditions</p>
                <p className="mt-2 text-2xl font-bold text-white">{groupedInfo.conditions.length}</p>
                <p className="text-sm text-blue-100/70">Tracked medical conditions</p>
              </div>
              <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-200/80">Medications</p>
                <p className="mt-2 text-2xl font-bold text-white">{groupedInfo.medications.length}</p>
                <p className="text-sm text-emerald-100/70">Current medication notes</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-300 mb-1">Latest Medical Entry</p>
                  <p className="text-xl font-bold text-white">{records[0].title}</p>
                  <p className="text-sm text-gray-400">{new Date(records[0].recordedAt).toLocaleDateString()}</p>
                </div>
                <Badge className={statusTone(records[0].status)}>{records[0].status ?? 'active'}</Badge>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
                <p className="text-sm font-semibold text-gray-300 mb-3">Known Allergies</p>
                {groupedInfo.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {groupedInfo.allergies.map((allergy, idx) => (
                      <Badge key={idx} variant="destructive" className="bg-red-900 text-red-100 hover:bg-red-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No allergy-specific records.</p>
                )}
              </div>

              <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
                <p className="text-sm font-semibold text-gray-300 mb-3">Medical Conditions</p>
                {groupedInfo.conditions.length > 0 ? (
                  <div className="space-y-2">
                    {groupedInfo.conditions.map((condition, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-md border border-blue-900/40 bg-blue-950/20 p-2">
                        <Activity className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-gray-200">{condition}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No condition-specific records.</p>
                )}
              </div>

              <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
                <p className="text-sm font-semibold text-gray-300 mb-3">Current Medications</p>
                {groupedInfo.medications.length > 0 ? (
                  <div className="space-y-2">
                    {groupedInfo.medications.map((medication, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-md border border-emerald-900/40 bg-emerald-950/20 p-2">
                        <Pill className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm text-gray-200">{medication}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No medication-specific records.</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-300">All Records</p>
              <div className="space-y-3">
                {records.map((record) => (
                  <div key={record.id} className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">{record.title}</p>
                        <p className="text-sm text-gray-400">{record.category}</p>
                      </div>
                      <Badge className={statusTone(record.status)}>{record.status ?? 'active'}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <Badge className="bg-gray-800 text-gray-100 border-gray-700">{record.category}</Badge>
                      <Badge className={statusTone(record.status)}>{record.status ?? 'active'}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-gray-200 leading-6">{record.notes}</p>
                    <p className="mt-3 text-xs text-gray-400">Recorded {new Date(record.recordedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <p className="text-sm font-semibold text-gray-300 mb-1">Last Medical Record Date</p>
              <p className="text-sm text-gray-200">
                {groupedInfo.latestRecordDate ? new Date(groupedInfo.latestRecordDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
