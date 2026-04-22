'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Award, Calendar } from 'lucide-react';

interface Organization {
  id: string;
  organizationName: string;
  role: string;
  joinedAt: string;
  status: string;
}

interface StudentOrganizationsProps {
  organizations: Organization[];
}

export function StudentOrganizations({ organizations }: StudentOrganizationsProps) {

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-400" />
          <div>
            <CardTitle>Student Organizations & Events</CardTitle>
            <CardDescription>Memberships and participation history</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {organizations.length > 0 ? (
          <div className="space-y-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="border border-gray-700 rounded-lg p-4 bg-gray-900/50 hover:bg-gray-900/80 transition"
              >
                <div className="mb-3">
                  <h4 className="font-semibold text-white mb-1">{org.organizationName}</h4>
                  <Badge className="bg-emerald-900/30 text-emerald-200 hover:bg-emerald-900/50">
                    {org.role}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{new Date(org.joinedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">Status: {org.status}</span>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Membership Status
                  </p>
                  <Badge className="bg-yellow-900/30 text-yellow-200 hover:bg-yellow-900/50 text-xs">{org.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Not a member of any organizations</p>
        )}
      </CardContent>
    </Card>
  );
}
