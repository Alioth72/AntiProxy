"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { AttendanceList } from "@/components/dashboard/attendance-list"
import { GamifyCharts } from "@/components/admin/gamify-charts"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Same dummy data as Teacher Dashboard
const lowAttendanceStudents = [
  { id: "1", name: "Rahul Sharma", rollNo: "CS2021001", attendance: 45 },
  { id: "2", name: "Priya Patel", rollNo: "CS2021015", attendance: 52 },
  { id: "3", name: "Amit Kumar", rollNo: "CS2021023", attendance: 68 },
  { id: "4", name: "Sneha Reddy", rollNo: "CS2021034", attendance: 71 },
  { id: "5", name: "Vikram Singh", rollNo: "CS2021042", attendance: 58 },
]

const highAttendanceStudents = [
  { id: "6", name: "Ananya Gupta", rollNo: "CS2021008", attendance: 92 },
  { id: "7", name: "Rohan Mehta", rollNo: "CS2021012", attendance: 88 },
  { id: "8", name: "Kavita Nair", rollNo: "CS2021019", attendance: 95 },
  { id: "9", name: "Arjun Das", rollNo: "CS2021027", attendance: 82 },
  { id: "10", name: "Meera Iyer", rollNo: "CS2021031", attendance: 78 },
]

export default function AdminAttendanceAnalyticsPage() {
  const [course, setCourse] = useState("cs101")
  const [section, setSection] = useState("a")

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview & Charts</TabsTrigger>
            <TabsTrigger value="students">Student Lists</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <GamifyCharts />
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <DashboardHeader
              course={course}
              section={section}
              onCourseChange={setCourse}
              onSectionChange={setSection}
            />

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Student Attendance Lists</h2>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                Under Development
              </Badge>
            </div>

            <div className="grid gap-6">
              <AttendanceList
                title="Students < 75% Attendance"
                students={lowAttendanceStudents}
                passingCriteria={45}
                variant="danger"
                showNotify
              />

              <AttendanceList
                title="Students > 75% Attendance"
                students={highAttendanceStudents}
                passingCriteria={33}
                variant="success"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
