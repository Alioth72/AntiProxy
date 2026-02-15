"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { calculateGrade, calculatePercentile } from "@/lib/mock-data/student-analysis"

interface MarksCardProps {
  marks: number
  maxMarks: number
}

export function MarksCard({ marks, maxMarks }: MarksCardProps) {
  const percentage = Math.round((marks / maxMarks) * 100)
  const grade = calculateGrade(percentage)
  const percentile = calculatePercentile(marks, maxMarks)

  const gradeColors: Record<string, string> = {
    "A+": "bg-green-100 text-green-800 border-green-200",
    A: "bg-green-100 text-green-700 border-green-200",
    "B+": "bg-blue-100 text-blue-700 border-blue-200",
    B: "bg-blue-100 text-blue-600 border-blue-200",
    C: "bg-yellow-100 text-yellow-700 border-yellow-200",
    D: "bg-orange-100 text-orange-700 border-orange-200",
    F: "bg-red-100 text-red-700 border-red-200",
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Marks Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">
              {marks}
              <span className="text-lg text-muted-foreground">/{maxMarks}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">Marks Obtained</p>
          </div>
          <Badge className={`text-lg px-4 py-2 ${gradeColors[grade]}`}>{grade}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Percentage</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">{percentile}</p>
            <p className="text-xs text-muted-foreground">Percentile</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">{percentage}%</p>
            <p className="text-xs text-muted-foreground">Score Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
