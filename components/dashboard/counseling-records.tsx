'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Calendar, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CounselingSession {
  id: string;
  sessionDate: string;
  topic: string;
  summary: string;
  nextStep: string;
  status?: string;
  reply?: string;
  replyAt?: string;
  counselor?: {
    id?: string;
    name?: string;
  };
}

interface FacultyOption {
  id: string;
  name: string;
  systemId: string;
}

interface CounselingRecordsProps {
  studentId: string;
  sessions: CounselingSession[];
}

export function CounselingRecords({ studentId, sessions }: CounselingRecordsProps) {
  const [items, setItems] = useState<CounselingSession[]>(sessions);
  const [facultyOptions, setFacultyOptions] = useState<FacultyOption[]>([]);
  const [topic, setTopic] = useState('Academic Planning');
  const [selectedCounselorId, setSelectedCounselorId] = useState('');
  const [summary, setSummary] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const sessionSummary = useMemo(() => {
    const open = items.filter((session) => (session.status ?? 'open').toLowerCase() === 'open').length;
    const closed = items.filter((session) => (session.status ?? '').toLowerCase() === 'closed').length;
    const replied = items.filter((session) => Boolean(session.reply?.trim())).length;

    return {
      open,
      closed,
      replied,
      total: items.length,
    };
  }, [items]);

  useEffect(() => {
    setItems(sessions);
  }, [sessions]);

  useEffect(() => {
    let mounted = true;

    async function loadFaculty() {
      try {
        const response = await fetch('/api/users?role=faculty&limit=200&sort=name&order=asc');
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Unable to load faculty options.');
        }

        if (mounted) {
          const mappedFaculty = (Array.isArray(payload.data) ? payload.data : []).map((faculty: any) => ({
            id: faculty.id,
            name: faculty.name,
            systemId: faculty.systemId,
          }));
          setFacultyOptions(mappedFaculty);
          setSelectedCounselorId((current) => current || mappedFaculty[0]?.id || '');
        }
      } catch {
        if (mounted) {
          setFacultyOptions([]);
        }
      }
    }

    loadFaculty();

    return () => {
      mounted = false;
    };
  }, []);

  const loadSessions = async () => {
    if (!studentId) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/counseling-records?student=${studentId}&populate=counselor&sort=sessionDate&order=desc&limit=100`);
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to load counseling sessions.');
      }

      setItems(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load counseling sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [studentId]);

  const createSession = async () => {
    if (!studentId) {
      return;
    }

    if (!summary.trim()) {
      setError('Session details are required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/counseling-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: studentId,
          counselor: selectedCounselorId || undefined,
          topic,
          summary: summary.trim(),
          nextStep: nextStep.trim(),
          sessionDate,
          status: 'open',
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to create counseling session.');
      }

      if (selectedCounselorId) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientRole: 'faculty',
            recipientId: selectedCounselorId,
            title: 'New counseling request',
            message: 'A student submitted a counseling request and is waiting for your response.',
            type: 'counseling',
            link: '/dashboard',
          }),
        });
      }

      setSummary('');
      setNextStep('');
      setSessionDate(new Date().toISOString().slice(0, 10));
      await loadSessions();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create counseling session.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSession = async (id: string) => {
    const confirmed = window.confirm('Delete this counseling record?');
    if (!confirmed) {
      return;
    }

    setError('');

    try {
      const response = await fetch(`/api/counseling-records/${id}`, { method: 'DELETE' });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to delete counseling record.');
      }

      setItems((previous) => previous.filter((session) => session.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete counseling record.');
    }
  };

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
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">Total</p>
            <p className="mt-1 text-2xl font-bold text-white">{sessionSummary.total}</p>
          </div>
          <div className="rounded-lg border border-blue-900/40 bg-blue-950/20 p-3">
            <p className="text-xs uppercase tracking-wide text-blue-200/80">Open</p>
            <p className="mt-1 text-2xl font-bold text-white">{sessionSummary.open}</p>
          </div>
          <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3">
            <p className="text-xs uppercase tracking-wide text-emerald-200/80">Replied</p>
            <p className="mt-1 text-2xl font-bold text-white">{sessionSummary.replied}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-300">Closed</p>
            <p className="mt-1 text-2xl font-bold text-white">{sessionSummary.closed}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <select
            value={selectedCounselorId}
            onChange={(event) => setSelectedCounselorId(event.target.value)}
            className="h-10 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white md:col-span-2"
          >
            <option value="">Select faculty counselor</option>
            {facultyOptions.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name} ({faculty.systemId})
              </option>
            ))}
          </select>
          <select
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="h-10 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
          >
            <option value="Academic Planning">Academic Planning</option>
            <option value="Career Guidance">Career Guidance</option>
            <option value="Stress Management">Stress Management</option>
            <option value="Financial Support">Financial Support</option>
            <option value="Personal Support">Personal Support</option>
          </select>
          <Input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className="md:col-span-2 bg-gray-800 border-gray-700 text-white"
            placeholder="Session details"
          />
          <Input
            type="date"
            value={sessionDate}
            onChange={(event) => setSessionDate(event.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={nextStep}
            onChange={(event) => setNextStep(event.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
            placeholder="Follow-up / next step"
          />
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={createSession} disabled={isSaving || isLoading}>
            {isSaving ? 'Submitting...' : 'Add Session'}
          </Button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading counseling sessions...</p>}

        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((session) => (
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
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getReasonColor(session.topic)}>{session.topic}</Badge>
                    <Badge className="bg-gray-800 text-gray-100 hover:bg-gray-800/90">{session.status ?? 'open'}</Badge>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Actions Taken</p>
                  <p className="text-sm text-gray-300">{session.summary}</p>
                </div>

                {session.nextStep && (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Follow-up Date</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-amber-400">{session.nextStep}</p>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => deleteSession(session.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-700 pt-3 mt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Faculty Reply</p>
                  {session.reply ? (
                    <div className="rounded-md border border-emerald-900/50 bg-emerald-950/20 p-3">
                      <p className="text-sm text-emerald-100">{session.reply}</p>
                      {session.replyAt && <p className="mt-1 text-xs text-emerald-300">Replied on {new Date(session.replyAt).toLocaleDateString()}</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Awaiting faculty reply.</p>
                  )}
                </div>
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
