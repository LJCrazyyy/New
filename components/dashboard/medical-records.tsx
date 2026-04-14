'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Heart, Pill, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MedicalInfo {
  bloodType: string;
  allergies: string[];
  medicalConditions: string[];
  currentMedications: string[];
  lastPhysicalExam: string;
}

export function MedicalRecords() {
  const medicalInfo: MedicalInfo = {
    bloodType: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    medicalConditions: ['Mild asthma'],
    currentMedications: ['Albuterol inhaler (as needed)'],
    lastPhysicalExam: 'March 5, 2024',
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
        {/* Blood Type */}
        <div className="border-l-4 border-red-500 pl-4">
          <p className="text-sm font-semibold text-gray-300 mb-1">Blood Type</p>
          <p className="text-xl font-bold text-white">{medicalInfo.bloodType}</p>
        </div>

        {/* Allergies */}
        <div>
          <p className="text-sm font-semibold text-gray-300 mb-3">Known Allergies</p>
          {medicalInfo.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {medicalInfo.allergies.map((allergy, idx) => (
                <Badge key={idx} variant="destructive" className="bg-red-900 text-red-100 hover:bg-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {allergy}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No known allergies</p>
          )}
        </div>

        {/* Medical Conditions */}
        <div>
          <p className="text-sm font-semibold text-gray-300 mb-3">Medical Conditions</p>
          {medicalInfo.medicalConditions.length > 0 ? (
            <div className="space-y-2">
              {medicalInfo.medicalConditions.map((condition, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-blue-950/30 p-2 rounded">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-200">{condition}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No medical conditions reported</p>
          )}
        </div>

        {/* Current Medications */}
        <div>
          <p className="text-sm font-semibold text-gray-300 mb-3">Current Medications</p>
          {medicalInfo.currentMedications.length > 0 ? (
            <div className="space-y-2">
              {medicalInfo.currentMedications.map((med, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-green-950/30 p-2 rounded">
                  <Pill className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-200">{med}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No medications reported</p>
          )}
        </div>

        {/* Last Physical Exam */}
        <div className="border-t border-gray-700 pt-4">
          <p className="text-sm font-semibold text-gray-300 mb-1">Last Physical Exam</p>
          <p className="text-sm text-gray-200">{medicalInfo.lastPhysicalExam}</p>
        </div>
      </CardContent>
    </Card>
  );
}
