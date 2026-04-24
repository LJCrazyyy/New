'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Document {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  status: string;
  createdAt: string;
  category: string;
}

interface StudentDocumentsProps {
  studentId: string;
  documents: Document[];
}

type DocumentFormState = {
  title: string;
  fileName: string;
  fileUrl: string;
  category: string;
  status: string;
};

const initialFormState: DocumentFormState = {
  title: '',
  fileName: '',
  fileUrl: '',
  category: 'Other',
  status: 'pending',
};

export function StudentDocuments({ studentId, documents }: StudentDocumentsProps) {
  const [items, setItems] = useState<Document[]>(documents);
  const [form, setForm] = useState<DocumentFormState>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setItems(documents);
  }, [documents]);

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [items]);

  const loadDocuments = async () => {
    if (!studentId) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/student-documents?student=${studentId}&sort=createdAt&order=desc&limit=100`);
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to load documents.');
      }

      setItems(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load documents.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [studentId]);

  const resetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
  };

  const startEdit = (doc: Document) => {
    setEditingId(doc.id);
    setForm({
      title: doc.title,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      category: doc.category,
      status: doc.status,
    });
  };

  const saveDocument = async () => {
    if (!studentId) {
      return;
    }

    if (!form.title.trim() || !form.fileName.trim() || !form.fileUrl.trim()) {
      setError('Title, file name, and file URL are required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const endpoint = editingId ? `/api/student-documents/${editingId}` : '/api/student-documents';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: studentId,
          title: form.title.trim(),
          fileName: form.fileName.trim(),
          fileUrl: form.fileUrl.trim(),
          category: form.category,
          status: form.status,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to save document.');
      }

      resetForm();
      await loadDocuments();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save document.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDocument = async (id: string) => {
    const confirmed = window.confirm('Delete this document entry?');
    if (!confirmed) {
      return;
    }

    setError('');

    try {
      const response = await fetch(`/api/student-documents/${id}`, { method: 'DELETE' });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to delete document.');
      }

      setItems((previous) => previous.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete document.');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Academic':
        return 'bg-blue-900/30 text-blue-200 hover:bg-blue-900/50';
      case 'Certificate':
        return 'bg-green-900/30 text-green-200 hover:bg-green-900/50';
      case 'Application':
        return 'bg-purple-900/30 text-purple-200 hover:bg-purple-900/50';
      case 'Letter':
        return 'bg-amber-900/30 text-amber-200 hover:bg-amber-900/50';
      default:
        return 'bg-gray-700/30 text-gray-200 hover:bg-gray-700/50';
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            <div>
              <CardTitle>Documents & Uploads</CardTitle>
              <CardDescription>Manage your documents and certifications</CardDescription>
            </div>
          </div>
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white" disabled>
            Student Managed
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <Input
            value={form.title}
            onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
            className="md:col-span-2 bg-gray-800 border-gray-700 text-white"
            placeholder="Document title"
          />
          <Input
            value={form.fileName}
            onChange={(event) => setForm((previous) => ({ ...previous, fileName: event.target.value }))}
            className="bg-gray-800 border-gray-700 text-white"
            placeholder="File name"
          />
          <Input
            value={form.fileUrl}
            onChange={(event) => setForm((previous) => ({ ...previous, fileUrl: event.target.value }))}
            className="md:col-span-2 bg-gray-800 border-gray-700 text-white"
            placeholder="File URL"
          />
          <select
            value={form.category}
            onChange={(event) => setForm((previous) => ({ ...previous, category: event.target.value }))}
            className="rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
          >
            <option value="Transcript">Transcript</option>
            <option value="Diploma">Diploma</option>
            <option value="Certificate">Certificate</option>
            <option value="ID">ID</option>
            <option value="Medical">Medical</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={form.status}
            onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value }))}
            className="h-9 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
          >
            <option value="pending">pending</option>
            <option value="available">available</option>
            <option value="archived">archived</option>
          </select>
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={saveDocument} disabled={isSaving || isLoading}>
            {isSaving ? 'Saving...' : editingId ? 'Update Document' : 'Add Document'}
          </Button>
          {editingId && (
            <Button variant="outline" className="border-gray-700 text-gray-300" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading documents...</p>}

        {sortedItems.length > 0 ? (
          <div className="space-y-3">
            {sortedItems.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border border-gray-700 rounded-lg bg-gray-900/50 hover:bg-gray-900/80 transition"
              >
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">{doc.fileName}</span>
                      <span className="text-gray-500">•</span>
                      <Badge className={getCategoryColor(doc.category)}>{doc.category}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                    onClick={() => window.open(doc.fileUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                    onClick={() => window.open(doc.fileUrl, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                    onClick={() => startEdit(doc)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-gray-800"
                    onClick={() => deleteDocument(doc.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No documents uploaded yet</p>
        )}
      </CardContent>
    </Card>
  );
}
