'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Plus, Save, Trash2, X } from 'lucide-react'

type UserRecord = {
  id: string
  systemId: string
  name: string
  email: string
  role: 'student' | 'faculty' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  joinedAt?: string
}

type UserForm = {
  systemId: string
  name: string
  email: string
  role: 'student' | 'faculty' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  password: string
}

const initialForm: UserForm = {
  systemId: '',
  name: '',
  email: '',
  role: 'student',
  status: 'active',
  password: '',
}

const API_PAGE_LIMIT = 100
const TABLE_PAGE_SIZE = 50

export function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRecord['role']>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<UserForm>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Pick<UserForm, 'name' | 'email' | 'role' | 'status' | 'password'>>({
    name: '',
    email: '',
    role: 'student',
    status: 'active',
    password: '',
  })

  const loadUsers = async () => {
    setIsLoading(true)
    setError('')

    try {
      const aggregatedUsers: UserRecord[] = []
      let page = 1
      let totalPages = 1

      while (page <= totalPages) {
        const response = await fetch(`/api/users?limit=${API_PAGE_LIMIT}&page=${page}&sort=name&order=asc`)
        const payload = await response.json()

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Failed to load users.')
        }

        aggregatedUsers.push(...((Array.isArray(payload.data) ? payload.data : []) as UserRecord[]))

        const pagesFromMeta = Number(payload?.meta?.pagination?.pages)
        totalPages = Number.isFinite(pagesFromMeta) && pagesFromMeta > 0 ? pagesFromMeta : 1
        page += 1
      }

      setUsers(aggregatedUsers)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load users.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    const roleFilteredUsers = roleFilter === 'all' ? users : users.filter((user) => user.role === roleFilter)
    if (!term) return roleFilteredUsers

    return roleFilteredUsers.filter((user) => {
      return [user.systemId, user.name, user.email, user.role, user.status].some((value) =>
        String(value ?? '').toLowerCase().includes(term)
      )
    })
  }, [users, search, roleFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / TABLE_PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedUsers = useMemo(() => {
    const start = (safeCurrentPage - 1) * TABLE_PAGE_SIZE
    return filteredUsers.slice(start, start + TABLE_PAGE_SIZE)
  }, [filteredUsers, safeCurrentPage])

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-900/30 text-red-200'
      case 'faculty':
        return 'bg-purple-900/30 text-purple-200'
      case 'student':
        return 'bg-blue-900/30 text-blue-200'
      default:
        return 'bg-gray-700/30 text-gray-200'
    }
  }

  const onCreateUser = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!createForm.systemId || !createForm.name || !createForm.email || !createForm.password) {
      setError('Please complete all required fields.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemId: createForm.systemId,
          name: createForm.name,
          email: createForm.email,
          passwordHash: createForm.password,
          role: createForm.role,
          status: createForm.status,
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create user.')
      }

      setCreateForm(initialForm)
      setShowCreate(false)
      await loadUsers()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create user.')
    } finally {
      setIsSaving(false)
    }
  }

  const onStartEdit = (user: UserRecord) => {
    setEditingId(user.id)
    setEditForm({ name: user.name, email: user.email, role: user.role, status: user.status, password: '' })
  }

  const onCancelEdit = () => {
    setEditingId(null)
  }

  const onSaveEdit = async () => {
    if (!editingId) return

    setError('')
    setIsSaving(true)

    try {
      const response = await fetch(`/api/users/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          status: editForm.status,
          ...(editForm.password.trim() ? { passwordHash: editForm.password.trim() } : {}),
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update user.')
      }

      onCancelEdit()
      await loadUsers()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update user.')
    } finally {
      setIsSaving(false)
    }
  }

  const onDeleteUser = async (id: string) => {
    const isConfirmed = window.confirm('Delete this user account? This action cannot be undone.')
    if (!isConfirmed) return

    setError('')

    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete user.')
      }

      setUsers((prev) => prev.filter((user) => user.id !== id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete user.')
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">User Management</CardTitle>
            <CardDescription>Manage system users and their roles</CardDescription>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowCreate((prev) => !prev)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreate ? 'Close' : 'Add User'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreate && (
          <form className="grid gap-3 md:grid-cols-3 rounded-lg border border-gray-700 bg-gray-800/40 p-4" onSubmit={onCreateUser}>
            <Input
              value={createForm.systemId}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, systemId: event.target.value }))}
              placeholder="System ID"
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Input
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Full name"
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Input
              value={createForm.email}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email"
              type="email"
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Input
              value={createForm.password}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Password"
              type="password"
              className="bg-gray-800 border-gray-700 text-white"
            />
            <select
              value={createForm.role}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value as UserForm['role'] }))}
              className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={createForm.status}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value as UserForm['status'] }))}
              className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                {isSaving ? 'Saving...' : 'Create User'}
              </Button>
            </div>
          </form>
        )}

        <div className="relative">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users by name, email, role, status..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        <div className="flex flex-col gap-2 text-sm text-gray-300 md:flex-row md:items-center md:justify-between">
          <div>
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <div className="flex items-center gap-2">
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as 'all' | UserRecord['role'])}
              className="h-9 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white"
            >
              <option value="all">All</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {isLoading && <p className="text-sm text-gray-400">Loading users...</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">System ID</th>
                <th className="text-left py-3 px-4 text-gray-400">User Name</th>
                <th className="text-left py-3 px-4 text-gray-400">Email</th>
                <th className="text-left py-3 px-4 text-gray-400">Reset Password</th>
                <th className="text-center py-3 px-4 text-gray-400">Role</th>
                <th className="text-center py-3 px-4 text-gray-400">Status</th>
                <th className="text-center py-3 px-4 text-gray-400">Joined</th>
                <th className="text-center py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-gray-300 text-xs">{user.systemId}</td>
                  <td className="py-3 px-4 text-white font-medium">
                    {editingId === user.id ? (
                      <Input
                        value={editForm.name}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Full name"
                        className="h-8 bg-gray-800 border-gray-700 text-white text-xs"
                      />
                    ) : (
                      user.name
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {editingId === user.id ? (
                      <Input
                        value={editForm.email}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder="Email"
                        type="email"
                        className="h-8 bg-gray-800 border-gray-700 text-white text-xs"
                      />
                    ) : (
                      user.email
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {editingId === user.id ? (
                      <Input
                        value={editForm.password}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, password: event.target.value }))}
                        placeholder="New password (optional)"
                        type="password"
                        className="h-8 bg-gray-800 border-gray-700 text-white text-xs"
                      />
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {editingId === user.id ? (
                      <select
                        value={editForm.role}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, role: event.target.value as UserForm['role'] }))}
                        className="h-8 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {editingId === user.id ? (
                      <select
                        value={editForm.status}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value as UserForm['status'] }))}
                        className="h-8 rounded-md border border-gray-700 bg-gray-800 px-2 text-xs text-white"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    ) : (
                      <Badge className={user.status === 'active' ? 'bg-green-600/50 text-green-200' : 'bg-red-600/50 text-red-200'}>
                        {user.status}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-400 text-xs">
                    {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-center space-x-1">
                    {editingId === user.id ? (
                      <>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-green-400" onClick={onSaveEdit}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={onCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={() => onStartEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400" onClick={() => onDeleteUser(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-400">
          <p>
            Page {safeCurrentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
