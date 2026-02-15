"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { TrendingUp, Users, GraduationCap, Award } from "lucide-react"

// Dummy data for branch-wise attendance
const branchAttendanceData = [
  { branch: "CSE", avgAttendance: 78, above75: 245, total: 320 },
  { branch: "ECE", avgAttendance: 72, above75: 198, total: 280 },
  { branch: "IT", avgAttendance: 81, above75: 187, total: 240 },
  { branch: "ME", avgAttendance: 68, above75: 156, total: 260 },
  { branch: "CE", avgAttendance: 74, above75: 134, total: 200 },
  { branch: "EE", avgAttendance: 76, above75: 167, total: 220 },
]

// Monthly trend data
const monthlyTrendData = [
  { month: "Aug", attendance: 82 },
  { month: "Sep", attendance: 78 },
  { month: "Oct", attendance: 75 },
  { month: "Nov", attendance: 71 },
  { month: "Dec", attendance: 68 },
  { month: "Jan", attendance: 74 },
]

// Calculate totals
const totalStudents = branchAttendanceData.reduce((acc, curr) => acc + curr.total, 0)
const totalAbove75 = branchAttendanceData.reduce((acc, curr) => acc + curr.above75, 0)
const overallAvgAttendance = Math.round(
  branchAttendanceData.reduce((acc, curr) => acc + curr.avgAttendance, 0) / branchAttendanceData.length,
)

export function GamifyCharts() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance Analytics</h1>
          <p className="text-muted-foreground">Branch-wise attendance statistics and insights</p>
        </div>
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
          Under Development
        </Badge>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold text-foreground">{totalStudents.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Students &gt;75% Attendance</p>
                <p className="text-3xl font-bold text-emerald-600">{totalAbove75.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-emerald-100">
                <Award className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Avg Attendance</p>
                <p className="text-3xl font-bold text-foreground">{overallAvgAttendance}%</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Branches</p>
                <p className="text-3xl font-bold text-foreground">{branchAttendanceData.length}</p>
              </div>
              <div className="p-3 rounded-full bg-amber-100">
                <GraduationCap className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Branch-wise Average Attendance */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg">Branch-wise Average Attendance</CardTitle>
            <CardDescription>Average attendance percentage by branch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="branch" tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="avgAttendance" fill="#10b981" radius={[4, 4, 0, 0]} name="Avg Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Under Development</p>
          </CardContent>
        </Card>

        {/* Line Chart - Monthly Attendance Trend */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Attendance Trend</CardTitle>
            <CardDescription>College-wide attendance trend over months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} domain={[60, 90]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                    name="Attendance %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Under Development</p>
          </CardContent>
        </Card>
      </div>

      {/* Branch-wise Table */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg">Branch-wise Attendance Statistics</CardTitle>
          <CardDescription>Detailed breakdown of students with &gt;75% attendance per branch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-900 hover:bg-neutral-900">
                  <TableHead className="text-white font-medium">Branch</TableHead>
                  <TableHead className="text-white font-medium text-center">Total Students</TableHead>
                  <TableHead className="text-white font-medium text-center">Students &gt;75%</TableHead>
                  <TableHead className="text-white font-medium text-center">Avg Attendance</TableHead>
                  <TableHead className="text-white font-medium text-center">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchAttendanceData.map((branch, index) => (
                  <TableRow key={branch.branch} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <TableCell className="font-medium">{branch.branch}</TableCell>
                    <TableCell className="text-center">{branch.total}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {branch.above75}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          branch.avgAttendance >= 75
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : branch.avgAttendance >= 70
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {branch.avgAttendance}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          branch.above75 / branch.total >= 0.7
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : branch.above75 / branch.total >= 0.6
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {Math.round((branch.above75 / branch.total) * 100)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Under Development</p>
        </CardContent>
      </Card>
    </div>
  )
}
