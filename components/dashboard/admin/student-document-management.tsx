'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Plus, Save, Trash2, X, ExternalLink } from 'lucide-react'

type StudentDocumentRecord = {
  id: string
  title: string
  category: string
  fileName: string
  fileUrl: string
  status: string
  user?: {
    id?: string
    name?: string
    systemId?: string
  }
}

type DocumentForm = {
  title: string
  category: string
  fileName: string
  fileUrl: string
  status: string
}

const initialForm: DocumentForm = {
  title: '',
  category: 'Transcript',
  fileName: '',
  fileUrl: '',
  status: 'available',
}

const categories = ['Transcript', 'Diploma', 'Certificate', 'ID', 'Financial Aid', 'Medical', 'Other']
const statuses = ['available', 'archived', 'pending']

export function StudentDocumentManagement() {
  const [documents, setDocuments] = useState<StudentDocumentRecord[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<DocumentForm>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<DocumentForm>(initialForm)

  const loadData = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/student-documents?limit=500&sort=-createdAt&populate=student')
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load student documents.')
      }

      setDocuments(Array.isArray(payload.data) ? payload.data : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load student documents.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return documents

    return documents.filter((doc) => {
      return [doc.title, doc.category, doc.user?.name, doc.fileName]
        .some((value) => String(value ?? '').toLowerCase().includes(term))
    })
  }, [documents, search])

  const onCreateDocument = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!createForm.title || !createForm.fileName || !createForm.fileUrl) {
      setError('Please complete all required fields.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/student-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create document record.')
      }

      setCreateForm(initialForm)
      setShowCreate(false)
      await loadData()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create document record.')
    } finally {
      setIsSaving(false)
    }
  }

  const onStartEdit = (doc: StudentDocumentRecord) => {
    setEditingId(doc.id)
    setEditForm({
      title: doc.title,
      category: doc.category,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      status: doc.status,
    })
  }

  const onCancelEdit = () => {
    setEditingId(null)
    setEditForm(initialForm)
  }

  const onSaveEdit = async () => {
    if (!editingId) return
    setError('')
    setIsSaving(true)

    try {
      const response = await fetch(`/api/student-documents/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update document.')
      }

      onCancelEdit()
      await loadData()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update document.')
    } finally {
      setIsSaving(false)
    }
  }

  const onDeleteDocument = async (id: string) => {
    const isConfirmed = window.confirm('Delete this document record? This action cannot be undone.')
    if (!isConfirmed) return

    try {
      const response = await fetch(`/api/student-documents/${id}`, { method: 'DELETE' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete document.')
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete document.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-900/30 text-green-200 border-green-700'
      case 'archived':
        return 'bg-gray-700/30 text-gray-200 border-gray-700'
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-200 border-yellow-700'
      default:
        return 'bg-gray-700/30 text-gray-200'
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Student Documents</CardTitle>
            <CardDescription>Manage student documents and certifications</CardDescription>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowCreate((prev) => !prev)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreate ? 'Close' : 'New Document'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreate && (
          <form className="gap-3 rounded-lg border border-gray-700 bg-gray-800/40 p-4 space-y-3" onSubmit={onCreateDocument}>
            <div className="grid gap-3 md:grid-cols-3">
              <Input value={createForm.title} onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))} placeholder="Document Title" className="bg-gray-800 border-gray-700 text-white" />
              <select value={createForm.category} onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select value={createForm.status} onChange={(e) => setCreateForm((p) => ({ ...p, status: e.target.value }))} className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white">
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={createForm.fileName} onChange={(e) => setCreateForm((p) => ({ ...p, fileName: e.target.value }))} placeholder="File Name" className="bg-gray-800 border-gray-700 text-white" />
              <Input value={createForm.fileUrl} onChange={(e) => setCreateForm((p) => ({ ...p, fileUrl: e.target.value }))} placeholder="File URL" className="bg-gray-800 border-gray-700 text-white" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">{isSaving ? 'Saving...' : 'Create Document'}</Button>
            </div>
          </form>
        )}

        <div className="relative">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, category, student name, file name..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading documents...</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Title</th>
                <th className="text-left py-3 px-4 text-gray-400">Category</th>
                <th className="text-left py-3 px-4 text-gray-400">Student</th>
                <th className="text-left py-3 px-4 text-gray-400">File Name</th>
                <th className="text-center py-3 px-4 text-gray-400">Status</th>
                <th className="text-center py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-medium">{doc.title}</td>
                  <td className="py-3 px-4">
                    <Badge className="bg-blue-900/30 text-blue-200 border-blue-700 border">{doc.category}</Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{doc.user?.name ?? 'Unknown'}</td>
                  {editingId === doc.id ? (
                    <>
                      <td className="py-3 px-4">
                        <Input value={editForm.fileName} onChange={(e) => setEditForm((p) => ({ ...p, fileName: e.target.value }))} className="bg-gray-700 border-gray-600 text-white text-xs" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} className="h-8 rounded-md border border-gray-600 bg-gray-700 px-2 text-sm text-white">
                          {statuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-4 text-gray-400 text-xs truncate max-w-xs">{doc.fileName}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                      </td>
                    </>
                  )}
                  <td className="py-3 px-4 text-center">
                    {editingId === doc.id ? (
                      <div className="flex justify-center gap-2">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onSaveEdit}><Save className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="border-gray-600" onClick={onCancelEdit}><X className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="outline" className="border-gray-600" onClick={() => window.open(doc.fileUrl, '_blank')}><ExternalLink className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="border-blue-600 text-blue-400 hover:text-blue-300" onClick={() => onStartEdit(doc)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:text-red-300" onClick={() => onDeleteDocument(doc.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDocuments.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No documents found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
