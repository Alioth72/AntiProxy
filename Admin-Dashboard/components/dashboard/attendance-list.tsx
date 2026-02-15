"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { useToast } from "@/components/ui/toast-provider"

interface Student {
  id: string
  name: string
  rollNo: string
  attendance: number
}

interface AttendanceListProps {
  title: string
  students: Student[]
  passingCriteria: number
  variant: "danger" | "success"
  showNotify?: boolean
}

export function AttendanceList({ title, students, passingCriteria, variant, showNotify = false }: AttendanceListProps) {
  const { showToast } = useToast()
  const borderColor = variant === "danger" ? "border-l-red-500" : "border-l-emerald-500"
  const badgeVariant =
    variant === "danger"
      ? "bg-red-100 text-red-700 border-red-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200"

  const handleNotify = () => {
    showToast("Notification sent")
  }

  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Passing Criteria: <span className="font-semibold text-foreground">{passingCriteria}%</span>
          </span>
          {showNotify && (
            <Button size="sm" variant="outline" className="gap-2 bg-transparent" onClick={handleNotify}>
              <Bell className="w-4 h-4" />
              Notify
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No students in this category</div>
        ) : (
          students.map((student) => (
            <div
              key={student.id}
              className={`flex items-center justify-between p-4 rounded-lg border border-border bg-card ${borderColor} border-l-4`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{student.name}</p>
                  <p className="text-sm text-muted-foreground">Roll No: {student.rollNo}</p>
                </div>
              </div>
              <Badge className={badgeVariant}>{student.attendance}% Attendance</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
