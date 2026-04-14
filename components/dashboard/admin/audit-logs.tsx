import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function AuditLogs() {
  const logs = [
    { id: 1, user: 'Admin User', action: 'User Created', resource: 'STU007 - New Student', timestamp: '2024-04-10 14:30:45', status: 'Success' },
    { id: 2, user: 'Dr. John Smith', action: 'Grade Updated', resource: 'CS101 - Alice Johnson', timestamp: '2024-04-10 13:15:22', status: 'Success' },
    { id: 3, user: 'Admin User', action: 'Course Deleted', resource: 'ENG202', timestamp: '2024-04-09 16:45:10', status: 'Success' },
    { id: 4, user: 'Dr. Sarah Lee', action: 'Attendance Marked', resource: 'MATH101 - 45 students', timestamp: '2024-04-09 10:20:33', status: 'Success' },
    { id: 5, user: 'Admin User', action: 'Permission Changed', resource: 'User: Prof. Maria', timestamp: '2024-04-08 09:15:44', status: 'Failed' },
    { id: 6, user: 'Bob Williams', action: 'Document Uploaded', resource: 'Academic Transcript', timestamp: '2024-04-08 08:30:12', status: 'Success' }
  ]

  const getActionColor = (action: string) => {
    if (action.includes('Created') || action.includes('Uploaded')) return 'bg-green-900/30 text-green-200'
    if (action.includes('Updated')) return 'bg-blue-900/30 text-blue-200'
    if (action.includes('Deleted')) return 'bg-red-900/30 text-red-200'
    if (action.includes('Changed')) return 'bg-yellow-900/30 text-yellow-200'
    return 'bg-gray-700/30 text-gray-200'
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Audit Logs</CardTitle>
        <CardDescription>System activity and administrative actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            placeholder="Search logs by user, action, or resource..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                    <Badge className={log.status === 'Success' ? 'bg-green-600/50 text-green-200' : 'bg-red-600/50 text-red-200'}>
                      {log.status}
                    </Badge>
                  </div>
                  <p className="text-white text-sm"><strong>User:</strong> {log.user}</p>
                  <p className="text-gray-400 text-xs mt-1"><strong>Resource:</strong> {log.resource}</p>
                </div>
                <div className="text-right text-gray-400 text-xs">
                  <p>{log.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
