"use client"

import { TeacherFeedbackTable } from "@/components/hod/teacher-feedback-table"
import { Badge } from "@/components/ui/badge"

export default function HODDashboardPage() {
  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-card">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">HOD Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitor teacher performance and department analytics</p>
        </div>
        <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <TeacherFeedbackTable />
      </div>
    </div>
  )
}
