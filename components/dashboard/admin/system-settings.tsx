import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Settings, Save } from 'lucide-react'

export function SystemSettings() {
  const settings = [
    { category: 'Academic Settings', items: [
      { name: 'Current Semester', value: 'Spring 2024', type: 'select' },
      { name: 'Academic Year', value: '2023-2024', type: 'text' },
      { name: 'Max Students per Course', value: '50', type: 'number' }
    ]},
    { category: 'System Configuration', items: [
      { name: 'System Name', value: 'University Academic System', type: 'text' },
      { name: 'Maintenance Mode', value: 'Disabled', type: 'toggle' },
      { name: 'Database Backup', value: 'Automated Daily', type: 'select' }
    ]},
    { category: 'Email Settings', items: [
      { name: 'SMTP Server', value: 'smtp.university.edu', type: 'text' },
      { name: 'Email Notifications', value: 'Enabled', type: 'toggle' },
      { name: 'Notification Frequency', value: 'Hourly', type: 'select' }
    ]},
    { category: 'Security Settings', items: [
      { name: 'Password Policy', value: 'Strong (8+ chars, mixed)', type: 'text' },
      { name: 'Two-Factor Auth', value: 'Optional', type: 'toggle' },
      { name: 'Session Timeout', value: '30 minutes', type: 'text' }
    ]}
  ]

  return (
    <div className="space-y-6">
      {settings.map((section) => (
        <Card key={section.category} className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">{section.category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {section.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-gray-400 text-xs">Current: {item.value}</p>
                  </div>
                  <Input
                    type={item.type === 'number' ? 'number' : 'text'}
                    defaultValue={item.value}
                    className="w-48 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
          Reset
        </Button>
        <Button className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
