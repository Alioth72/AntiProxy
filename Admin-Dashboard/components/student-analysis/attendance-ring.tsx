"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AttendanceRingProps {
  percentage: number
  sessionsAttended: number
  totalSessions: number
}

export function AttendanceRing({ percentage, sessionsAttended, totalSessions }: AttendanceRingProps) {
  const radius = 60
  const strokeWidth = 12
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = (pct: number) => {
    if (pct >= 75) return "hsl(var(--chart-2))"
    if (pct >= 50) return "hsl(var(--chart-4))"
    return "hsl(var(--destructive))"
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Attendance Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-8">
          <div className="relative">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
              <circle
                stroke="hsl(var(--muted))"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke={getColor(percentage)}
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + " " + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{percentage}%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Sessions Attended</p>
              <p className="text-xl font-semibold">
                {sessionsAttended} / {totalSessions}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p
                className={`text-sm font-medium ${percentage >= 75 ? "text-green-600" : percentage >= 50 ? "text-yellow-600" : "text-red-600"}`}
              >
                {percentage >= 75 ? "Good Standing" : percentage >= 50 ? "Needs Improvement" : "Critical"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
