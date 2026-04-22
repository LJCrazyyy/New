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
            <div className="border-l-4 border-red-500 pl-4">
              <p className="text-sm font-semibold text-gray-300 mb-1">Latest Medical Entry</p>
              <p className="text-xl font-bold text-white">{records[0].title}</p>
            </div>

            <div>
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

            <div>
              <p className="text-sm font-semibold text-gray-300 mb-3">Medical Conditions</p>
              {groupedInfo.conditions.length > 0 ? (
                <div className="space-y-2">
                  {groupedInfo.conditions.map((condition, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-blue-950/30 p-2 rounded">
                      <Activity className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-gray-200">{condition}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No condition-specific records.</p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-300 mb-3">Current Medications</p>
              {groupedInfo.medications.length > 0 ? (
                <div className="space-y-2">
                  {groupedInfo.medications.map((medication, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-green-950/30 p-2 rounded">
                      <Pill className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-gray-200">{medication}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No medication-specific records.</p>
              )}
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
