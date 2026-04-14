import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Upload, Save } from 'lucide-react'

export function GradeEntry() {
  const grades = [
    { studentId: 'STU001', name: 'Alice Johnson', prelim: 88, midterm: 90, final: 92, average: 90.0 },
    { studentId: 'STU002', name: 'Bob Williams', prelim: 78, midterm: 82, final: 85, average: 81.7 },
    { studentId: 'STU003', name: 'Carol Davis', prelim: 92, midterm: 94, final: 96, average: 94.0 },
    { studentId: 'STU004', name: 'David Brown', prelim: 85, midterm: 87, final: 88, average: 86.7 },
    { studentId: 'STU005', name: 'Eve Martinez', prelim: 91, midterm: 93, final: 94, average: 92.7 }
  ]

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'bg-green-900/30 text-green-200'
    if (grade >= 80) return 'bg-blue-900/30 text-blue-200'
    if (grade >= 70) return 'bg-yellow-900/30 text-yellow-200'
    return 'bg-red-900/30 text-red-200'
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Grade Entry</CardTitle>
            <CardDescription>CS101 - Introduction to Programming (Section 01)</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400">Student</th>
                <th className="text-center py-3 px-4 text-gray-400">Prelim</th>
                <th className="text-center py-3 px-4 text-gray-400">Midterm</th>
                <th className="text-center py-3 px-4 text-gray-400">Final</th>
                <th className="text-center py-3 px-4 text-gray-400">Average</th>
                <th className="text-center py-3 px-4 text-gray-400">Grade</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={grade.studentId} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-white font-medium">{grade.name}</p>
                      <p className="text-xs text-gray-400">{grade.studentId}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Input
                      type="number"
                      defaultValue={grade.prelim}
                      className="w-12 h-8 bg-gray-800 border-gray-700 text-white text-center text-xs"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Input
                      type="number"
                      defaultValue={grade.midterm}
                      className="w-12 h-8 bg-gray-800 border-gray-700 text-white text-center text-xs"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Input
                      type="number"
                      defaultValue={grade.final}
                      className="w-12 h-8 bg-gray-800 border-gray-700 text-white text-center text-xs"
                    />
                  </td>
                  <td className="py-3 px-4 text-center text-white font-semibold">{grade.average.toFixed(1)}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={getGradeColor(grade.average)}>
                      {grade.average >= 90 ? 'A' : grade.average >= 80 ? 'B' : grade.average >= 70 ? 'C' : 'D'}
                    </Badge>
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
