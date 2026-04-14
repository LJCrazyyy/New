import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'

export function StudentPerformance() {
  const performance = [
    { name: 'Alice Johnson', id: 'STU001', average: 90.0, trend: 'up', status: 'Excellent', attendance: 95 },
    { name: 'Bob Williams', id: 'STU002', average: 81.7, trend: 'stable', status: 'Very Good', attendance: 87 },
    { name: 'Carol Davis', id: 'STU003', average: 94.0, trend: 'up', status: 'Excellent', attendance: 98 },
    { name: 'David Brown', id: 'STU004', average: 86.7, trend: 'up', status: 'Very Good', attendance: 92 },
    { name: 'Eve Martinez', id: 'STU005', average: 92.7, trend: 'stable', status: 'Excellent', attendance: 85 },
    { name: 'Frank Garcia', id: 'STU006', average: 78.3, trend: 'down', status: 'Good', attendance: 76 }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent':
        return 'bg-green-600/50 text-green-200'
      case 'Very Good':
        return 'bg-blue-600/50 text-blue-200'
      case 'Good':
        return 'bg-yellow-600/50 text-yellow-200'
      default:
        return 'bg-red-600/50 text-red-200'
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '↗'
    if (trend === 'down') return '↘'
    return '→'
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Student Performance Analysis
        </CardTitle>
        <CardDescription>CS101 - Class Performance Metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {performance.map((student) => (
            <div key={student.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-white font-semibold">{student.name}</h4>
                  <p className="text-xs text-gray-400">{student.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{student.average.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">Average</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={getStatusColor(student.status)}>
                  {student.status}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>Trend:</span>
                  <span className={getTrendIcon(student.trend) === '↗' ? 'text-green-400' : getTrendIcon(student.trend) === '↘' ? 'text-red-400' : 'text-gray-400'}>
                    {getTrendIcon(student.trend)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>Attendance:</span>
                  <span className="text-white font-semibold">{student.attendance}%</span>
                </div>
              </div>

              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    student.average >= 90 ? 'bg-green-500' : 
                    student.average >= 80 ? 'bg-blue-500' : 
                    'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(student.average, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
