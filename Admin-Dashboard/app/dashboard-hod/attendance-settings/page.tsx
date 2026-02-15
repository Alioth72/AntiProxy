"use client"

import { AttendanceSettings } from "@/components/hod/attendance-settings"
import { Badge } from "@/components/ui/badge"

export default function AttendanceSettingsPage() {
  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-card">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Attendance Settings</h1>
          <p className="text-sm text-muted-foreground">Configure passing criteria and attendance rules</p>
        </div>
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">Under Development</Badge>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <AttendanceSettings />
      </div>
    </div>
  )
}
