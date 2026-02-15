"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, AlertTriangle, TrendingDown, BookOpen } from "lucide-react"

interface NEPInsightCardProps {
  studentName: string
  rollNo: string
  insight: string
  category: "logic" | "attendance" | "performance" | "engagement"
  internalMarks?: number
  midSemMarks?: number
  endSemMarks?: number
  quizMarks?: number
  attendance?: number
}

const categoryConfig = {
  logic: {
    icon: Brain,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    borderColor: "border-l-amber-500",
  },
  attendance: {
    icon: AlertTriangle,
    color: "bg-red-100 text-red-700 border-red-200",
    borderColor: "border-l-red-500",
  },
  performance: {
    icon: TrendingDown,
    color: "bg-orange-100 text-orange-700 border-orange-200",
    borderColor: "border-l-orange-500",
  },
  engagement: {
    icon: BookOpen,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    borderColor: "border-l-blue-500",
  },
}

export function NEPInsightCard({
  studentName,
  rollNo,
  insight,
  category,
  internalMarks,
  midSemMarks,
  endSemMarks,
  quizMarks,
  attendance,
}: NEPInsightCardProps) {
  const config = categoryConfig[category]
  const Icon = config.icon

  return (
    <Card className={`border border-border ${config.borderColor} border-l-4`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-6">
          {/* Left Section - Student Info */}
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-muted-foreground">
                {studentName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div className="space-y-2 flex-1">
              <div>
                <p className="font-semibold text-foreground">{studentName}</p>
                <p className="text-sm text-muted-foreground">Roll No: {rollNo}</p>
              </div>

              {attendance !== undefined && <p className="text-sm text-muted-foreground">Attendance: {attendance}%</p>}

              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-foreground italic">&quot;{insight}&quot;</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={config.color}>AI-Generated Insight</Badge>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                  Under Development
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-stretch gap-0 border-l border-border">
            {internalMarks !== undefined && (
              <div className="flex flex-col items-center justify-center px-4 py-2 border-r border-border min-w-[80px]">
                <span className="text-xs text-muted-foreground mb-1">Internal</span>
                <span className="text-lg font-semibold text-foreground">{internalMarks}</span>
                <span className="text-xs text-muted-foreground">/30</span>
              </div>
            )}
            {midSemMarks !== undefined && (
              <div className="flex flex-col items-center justify-center px-4 py-2 border-r border-border min-w-[80px]">
                <span className="text-xs text-muted-foreground mb-1">Mid-Sem</span>
                <span className="text-lg font-semibold text-foreground">{midSemMarks}</span>
                <span className="text-xs text-muted-foreground">/25</span>
              </div>
            )}
            {endSemMarks !== undefined && (
              <div className="flex flex-col items-center justify-center px-4 py-2 border-r border-border min-w-[80px]">
                <span className="text-xs text-muted-foreground mb-1">End-Sem</span>
                <span className="text-lg font-semibold text-foreground">{endSemMarks}</span>
                <span className="text-xs text-muted-foreground">/45</span>
              </div>
            )}
            {quizMarks !== undefined && (
              <div className="flex flex-col items-center justify-center px-4 py-2 min-w-[80px]">
                <span className="text-xs text-muted-foreground mb-1">Quiz</span>
                <span className="text-lg font-semibold text-foreground">{quizMarks}</span>
                <span className="text-xs text-muted-foreground">/10</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
