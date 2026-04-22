import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, MapPin } from 'lucide-react'

interface FacultyProfileProps {
  faculty?: {
    name?: string
    email?: string
    systemId?: string
    status?: string
  }
  profile?: {
    employeeNumber?: string
    department?: string
    title?: string
    office?: string
  } | null
}

export function FacultyProfile({ faculty, profile }: FacultyProfileProps) {
  const initials = (faculty?.name ?? 'Faculty')
    .split(' ')
    .map((namePart) => namePart[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Faculty Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>
          <h3 className="text-lg font-bold text-white">{faculty?.name ?? 'Faculty Member'}</h3>
          <p className="text-sm text-gray-400">{profile?.title ?? 'Faculty'}</p>
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-700">
          <div className="flex items-start gap-2">
            <span className="text-gray-500 text-sm w-24">ID:</span>
            <span className="text-white text-sm">{profile?.employeeNumber ?? faculty?.systemId ?? 'N/A'}</span>
          </div>
          
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
            <span className="text-white text-sm">{faculty?.email ?? 'N/A'}</span>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
            <span className="text-white text-sm">{profile?.office ?? 'N/A'}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-700 space-y-2">
          <div className="text-xs text-gray-400">Department</div>
          <Badge className="bg-purple-600/50 text-purple-200">{profile?.department ?? 'N/A'}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-700">
          <div>
            <p className="text-xs text-gray-400">Status</p>
            <Badge className="bg-green-600/50 text-green-200">{faculty?.status ?? 'active'}</Badge>
          </div>
          <div>
            <p className="text-xs text-gray-400">Role</p>
            <p className="text-white text-sm font-semibold">Faculty</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
