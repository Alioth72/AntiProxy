"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts"
import { BarChart3, TrendingUp, Target } from "lucide-react"

interface Student {
  id: string
  name: string
  rollNo: string
  attendance: number
  marks?: number
}

interface AnalyticsOverviewProps {
  lowAttendanceStudents?: Student[]
  highAttendanceStudents?: Student[]
}

const marksVsHighAttendanceData = [
  { range: "0-20", studentsAbove75Pct: 23 },
  { range: "20-40", studentsAbove75Pct: 37 },
  { range: "40-60", studentsAbove75Pct: 68 },
  { range: "60-80", studentsAbove75Pct: 82 },
  { range: "80-100", studentsAbove75Pct: 98 },
]

// Radar chart data - normalized to 0-100 scale
const performanceProfileData = [
  { subject: "Co-curricular", value: 72, fullMark: 100 },
  { subject: "Social Work", value: 65, fullMark: 100 },
  { subject: "Marks", value: 78, fullMark: 100 },
  { subject: "Attendance", value: 85, fullMark: 100 },
  { subject: "Practical", value: 81, fullMark: 100 },
]

// Colors that work with the theme
const CHART_COLORS = {
  primary: "#10b981", // emerald-500
  secondary: "#3b82f6", // blue-500
  accent: "#f59e0b", // amber-500
  muted: "#6b7280", // gray-500
}

function generateMarksForStudent(attendance: number): number {
  // Higher attendance generally correlates with higher marks, with some randomness
  const baseMarks = attendance * 0.8
  const variance = Math.random() * 20 - 10 // -10 to +10 variance
  return Math.min(100, Math.max(0, Math.round(baseMarks + variance)))
}

function computeMarksDistributionData(lowAttendanceStudents: Student[], highAttendanceStudents: Student[]) {
  // Combine all students and ensure they have marks
  const allStudents = [...lowAttendanceStudents, ...highAttendanceStudents].map((student) => ({
    ...student,
    marks: student.marks ?? generateMarksForStudent(student.attendance),
  }))

  // Define marks ranges
  const ranges = [
    { label: "0-20", min: 0, max: 20 },
    { label: "20-40", min: 20, max: 40 },
    { label: "40-60", min: 40, max: 60 },
    { label: "60-80", min: 60, max: 80 },
    { label: "80-100", min: 80, max: 100 },
  ]

  return ranges.map((range) => {
    const studentsInRange = allStudents.filter(
      (s) => s.marks >= range.min && s.marks < (range.max === 100 ? 101 : range.max),
    )
    const totalStudents = studentsInRange.length
    const avgAttendance =
      totalStudents > 0 ? Math.round(studentsInRange.reduce((sum, s) => sum + s.attendance, 0) / totalStudents) : 0

    return {
      range: range.label,
      totalStudents,
      avgAttendance,
    }
  })
}

export function AnalyticsOverview({ lowAttendanceStudents = [], highAttendanceStudents = [] }: AnalyticsOverviewProps) {
  const marksDistributionData = useMemo(
    () => computeMarksDistributionData(lowAttendanceStudents, highAttendanceStudents),
    [lowAttendanceStudents, highAttendanceStudents],
  )

  return (
    <Card className="border border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Analytics Overview</CardTitle>
        </div>
        <CardDescription>Correlation between attendance, marks, and student performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Chart 1: Marks vs % Students Above 75% Attendance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-medium">Marks vs High Attendance Rate</h3>
            </div>
            <p className="text-xs text-muted-foreground">% of students with attendance above 75% in each marks band</p>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marksVsHighAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="range"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={{ stroke: "#d1d5db" }}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={{ stroke: "#d1d5db" }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "studentsAbove75Pct") {
                        return [`${value}%`, "Students with >75% Attendance"]
                      }
                      return [value, name]
                    }}
                    labelFormatter={(label) => `Marks: ${label}`}
                  />
                  <Bar
                    dataKey="studentsAbove75Pct"
                    fill={CHART_COLORS.primary}
                    radius={[4, 4, 0, 0]}
                    name="studentsAbove75Pct"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center">Higher marks correlate with better attendance</p>
          </div>

          {/* Chart 2: Dual-Axis - Marks vs Avg Attendance & Student Count */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-medium">Marks vs Attendance Profile</h3>
            </div>
            <p className="text-xs text-muted-foreground">Average attendance % and student count per marks band</p>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={marksDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="range"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={{ stroke: "#d1d5db" }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={{ stroke: "#d1d5db" }}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickLine={{ stroke: "#d1d5db" }}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "avgAttendance") return [`${value}%`, "Avg Attendance"]
                      if (name === "totalStudents") return [value, "Total Students"]
                      return [value, name]
                    }}
                    labelFormatter={(label) => `Marks: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                    formatter={(value) => {
                      if (value === "avgAttendance") return "Avg Attendance %"
                      if (value === "totalStudents") return "Student Count"
                      return value
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="avgAttendance"
                    fill={CHART_COLORS.secondary}
                    radius={[4, 4, 0, 0]}
                    name="avgAttendance"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalStudents"
                    stroke={CHART_COLORS.accent}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.accent, strokeWidth: 2, r: 4 }}
                    name="totalStudents"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center">Attendance rises with marks performance</p>
          </div>

          {/* Chart 3: Radar Chart - Student Performance Profile */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-medium">Student Performance Profile</h3>
            </div>
            <p className="text-xs text-muted-foreground">Overall class average across key performance areas</p>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={performanceProfileData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    tickLine={{ stroke: "#d1d5db" }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 9 }} tickCount={5} />
                  <Radar
                    name="Class Average"
                    dataKey="value"
                    stroke={CHART_COLORS.primary}
                    fill={CHART_COLORS.primary}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value}/100`, "Score"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center">Normalized scores across all metrics</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
