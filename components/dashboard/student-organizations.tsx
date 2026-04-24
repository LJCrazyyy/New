'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Award, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Organization {
  id: string;
  organizationName: string;
  role: string;
  joinedAt: string;
  status: string;
}

interface StudentOrganizationsProps {
  studentId: string;
  organizations: Organization[];
}

type OrganizationFormState = {
  organizationName: string;
  role: string;
  status: string;
  joinedAt: string;
};

const initialFormState: OrganizationFormState = {
  organizationName: '',
  role: 'Member',
  status: 'active',
  joinedAt: new Date().toISOString().slice(0, 10),
};

export function StudentOrganizations({ studentId, organizations }: StudentOrganizationsProps) {
  const [items, setItems] = useState<Organization[]>(organizations);
  const [form, setForm] = useState<OrganizationFormState>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setItems(organizations);
  }, [organizations]);

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => new Date(right.joinedAt).getTime() - new Date(left.joinedAt).getTime());
  }, [items]);

  const loadOrganizations = async () => {
    if (!studentId) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/student-organizations?student=${studentId}&sort=joinedAt&order=desc&limit=100`);
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to load organizations.');
      }

      setItems(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load organizations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, [studentId]);

  const resetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
  };

  const startEdit = (org: Organization) => {
    setEditingId(org.id);
    setForm({
      organizationName: org.organizationName,
      role: org.role,
      status: org.status,
      joinedAt: new Date(org.joinedAt).toISOString().slice(0, 10),
    });
  };

  const saveOrganization = async () => {
    if (!studentId) {
      return;
    }

    if (!form.organizationName.trim()) {
      setError('Organization name is required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const endpoint = editingId ? `/api/student-organizations/${editingId}` : '/api/student-organizations';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: studentId,
          organizationName: form.organizationName.trim(),
          role: form.role,
          status: form.status,
          joinedAt: form.joinedAt,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to save organization.');
      }

      resetForm();
      await loadOrganizations();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save organization.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOrganization = async (id: string) => {
    const confirmed = window.confirm('Delete this organization membership?');
    if (!confirmed) {
      return;
    }

    setError('');

    try {
      const response = await fetch(`/api/student-organizations/${id}`, { method: 'DELETE' });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to delete organization.');
      }

      setItems((previous) => previous.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete organization.');
    }
  };

  return (
    <Card className="border-0 shadow-md bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-400" />
          <div>
            <CardTitle className="text-white">Student Organizations & Events</CardTitle>
            <CardDescription>Memberships and participation history</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <Input
            value={form.organizationName}
            onChange={(event) => setForm((previous) => ({ ...previous, organizationName: event.target.value }))}
            className="md:col-span-2 bg-gray-800 border-gray-700 text-white"
            placeholder="Organization name"
          />
          <select
            value={form.role}
            onChange={(event) => setForm((previous) => ({ ...previous, role: event.target.value }))}
            className="h-10 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
          >
            <option value="President">President</option>
            <option value="Vice President">Vice President</option>
            <option value="Secretary">Secretary</option>
            <option value="Treasurer">Treasurer</option>
            <option value="Officer">Officer</option>
            <option value="Member">Member</option>
          </select>
          <select
            value={form.status}
            onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value }))}
            className="h-10 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="graduated">graduated</option>
          </select>
          <Input
            type="date"
            value={form.joinedAt}
            onChange={(event) => setForm((previous) => ({ ...previous, joinedAt: event.target.value }))}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveOrganization} disabled={isSaving || isLoading}>
            {isSaving ? 'Saving...' : editingId ? 'Update Membership' : 'Add Membership'}
          </Button>
          {editingId && (
            <Button variant="outline" className="border-gray-700 text-gray-300" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading organizations...</p>}

        {sortedItems.length > 0 ? (
          <div className="space-y-4">
            {sortedItems.map((org) => (
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
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-900/30 text-yellow-200 hover:bg-yellow-900/50 text-xs">{org.status}</Badge>
                    <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300" onClick={() => startEdit(org)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => deleteOrganization(org.id)}>
                      Delete
                    </Button>
                  </div>
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
