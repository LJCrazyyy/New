import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Plus, Lock } from 'lucide-react'

export function UserManagement() {
  const users = [
    { id: 'USR001', name: 'Alice Johnson', email: 'alice@university.edu', role: 'Student', status: 'Active', joined: '2023-01-15' },
    { id: 'USR002', name: 'Dr. John Smith', email: 'john.smith@university.edu', role: 'Faculty', status: 'Active', joined: '2020-08-20' },
    { id: 'USR003', name: 'Admin User', email: 'admin@university.edu', role: 'Admin', status: 'Active', joined: '2019-06-10' },
    { id: 'USR004', name: 'Bob Williams', email: 'bob@university.edu', role: 'Student', status: 'Inactive', joined: '2022-09-01' },
    { id: 'USR005', name: 'Dr. Sarah Lee', email: 'sarah.lee@university.edu', role: 'Faculty', status: 'Active', joined: '2021-02-15' },
    { id: 'USR006', name: 'Carol Davis', email: 'carol@university.edu', role: 'Student', status: 'Active', joined: '2023-09-05' }
  ]

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-900/30 text-red-200'
      case 'Faculty':
        return 'bg-purple-900/30 text-purple-200'
      case 'Student':
        return 'bg-blue-900/30 text-blue-200'
      default:
        return 'bg-gray-700/30 text-gray-200'
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
          <Button className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            placeholder="Search users by name or email..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">User Name</th>
                <th className="text-left py-3 px-4 text-gray-400">Email</th>
                <th className="text-center py-3 px-4 text-gray-400">Role</th>
                <th className="text-center py-3 px-4 text-gray-400">Status</th>
                <th className="text-center py-3 px-4 text-gray-400">Joined</th>
                <th className="text-center py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-medium">{user.name}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{user.email}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={user.status === 'Active' ? 'bg-green-600/50 text-green-200' : 'bg-red-600/50 text-red-200'}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-400 text-xs">{user.joined}</td>
                  <td className="py-3 px-4 text-center space-x-1">
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
