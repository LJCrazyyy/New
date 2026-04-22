import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp } from 'lucide-react'

interface StudentPerformanceProps {
  performance: Array<{
    id: string
    name: string
    average: number
    status: string
    year: number
  }>
}

const PAGE_SIZE = 10

export function StudentPerformance({ performance }: StudentPerformanceProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(performance.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedPerformance = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return performance.slice(start, start + PAGE_SIZE)
  }, [performance, safeCurrentPage])

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

  const getTrendIcon = (average: number) => {
    if (average >= 90) return '↗'
    if (average >= 80) return '→'
    return '↘'
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Student Performance Analysis
        </CardTitle>
        <CardDescription>Live performance metrics from enrolled classes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between text-sm text-gray-400">
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

        <div className="space-y-3">
          {paginatedPerformance.map((student) => (
            <div key={student.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-white font-semibold">{student.name}</h4>
                  <p className="text-xs text-gray-400">Year {student.year}</p>
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
                  <span className={getTrendIcon(student.average) === '↗' ? 'text-green-400' : getTrendIcon(student.average) === '↘' ? 'text-red-400' : 'text-gray-400'}>
                    {getTrendIcon(student.average)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>Record:</span>
                  <span className="text-white font-semibold">{student.id}</span>
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
