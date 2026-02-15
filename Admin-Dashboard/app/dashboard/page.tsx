"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { AttendanceList } from "@/components/dashboard/attendance-list"
import { AnalyticsOverview } from "@/components/dashboard/analytics-overview"

// Dummy data for students
const lowAttendanceStudents = [
  // 0-20 marks range - very low attendance
  { id: "1", name: "Raj Verma", rollNo: "CS2021050", attendance: 28, marks: 12 },
  { id: "2", name: "Deepak Yadav", rollNo: "CS2021051", attendance: 32, marks: 18 },
  { id: "3", name: "Sunil Chauhan", rollNo: "CS2021052", attendance: 25, marks: 15 },
  // 20-40 marks range - low attendance
  { id: "4", name: "Rahul Sharma", rollNo: "CS2021001", attendance: 45, marks: 32 },
  { id: "5", name: "Priya Patel", rollNo: "CS2021015", attendance: 52, marks: 38 },
  { id: "6", name: "Neha Joshi", rollNo: "CS2021053", attendance: 42, marks: 25 },
  { id: "7", name: "Karan Malhotra", rollNo: "CS2021054", attendance: 48, marks: 35 },
  // 40-60 marks range - moderate attendance (slightly lower than 60-80)
  { id: "8", name: "Amit Kumar", rollNo: "CS2021023", attendance: 68, marks: 55 },
  { id: "9", name: "Vikram Singh", rollNo: "CS2021042", attendance: 58, marks: 48 },
  { id: "10", name: "Pooja Agarwal", rollNo: "CS2021055", attendance: 62, marks: 52 },
  { id: "11", name: "Sanjay Mishra", rollNo: "CS2021056", attendance: 65, marks: 58 },
  // 60-80 marks range - good attendance (similar to 40-60 but slightly higher)
  { id: "12", name: "Sneha Reddy", rollNo: "CS2021034", attendance: 71, marks: 62 },
  { id: "13", name: "Ravi Prakash", rollNo: "CS2021057", attendance: 74, marks: 68 },
]

const highAttendanceStudents = [
  { id: "30", name: "Tarun Bose", rollNo: "CS2021070", attendance: 77, marks: 14 },
  { id: "31", name: "Manish Tiwari", rollNo: "CS2021071", attendance: 76, marks: 28 },
  { id: "32", name: "Rekha Sinha", rollNo: "CS2021072", attendance: 78, marks: 36 },
  // 40-60 marks range - ~50% high attendance (slightly less than 60-80)
  { id: "14", name: "Anil Kapoor", rollNo: "CS2021058", attendance: 76, marks: 54 },
  { id: "15", name: "Sunita Sharma", rollNo: "CS2021059", attendance: 78, marks: 58 },
  { id: "33", name: "Pankaj Gupta", rollNo: "CS2021073", attendance: 77, marks: 45 },
  { id: "34", name: "Nisha Verma", rollNo: "CS2021074", attendance: 79, marks: 52 },
  // 60-80 marks range - ~60% high attendance (similar to 40-60 but slightly higher)
  { id: "16", name: "Meera Iyer", rollNo: "CS2021031", attendance: 78, marks: 68 },
  { id: "17", name: "Arjun Das", rollNo: "CS2021027", attendance: 82, marks: 72 },
  { id: "18", name: "Geeta Rao", rollNo: "CS2021060", attendance: 80, marks: 75 },
  { id: "19", name: "Vivek Saxena", rollNo: "CS2021061", attendance: 79, marks: 66 },
  { id: "35", name: "Lakshmi Nair", rollNo: "CS2021075", attendance: 81, marks: 70 },
  { id: "36", name: "Rajesh Kumar", rollNo: "CS2021076", attendance: 76, marks: 64 },
  // 80-100 marks range - high attendance
  { id: "20", name: "Ananya Gupta", rollNo: "CS2021008", attendance: 92, marks: 85 },
  { id: "21", name: "Rohan Mehta", rollNo: "CS2021012", attendance: 88, marks: 82 },
  { id: "22", name: "Kavita Nair", rollNo: "CS2021019", attendance: 95, marks: 91 },
  { id: "23", name: "Nikhil Bansal", rollNo: "CS2021062", attendance: 90, marks: 88 },
  { id: "24", name: "Shruti Menon", rollNo: "CS2021063", attendance: 94, marks: 96 },
]

export default function TeacherDashboard() {
  const [course, setCourse] = useState("cs101")
  const [section, setSection] = useState("a")

  return (
    <div className="flex-1 flex flex-col bg-background">
      <DashboardHeader course={course} section={section} onCourseChange={setCourse} onSectionChange={setSection} />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <AnalyticsOverview
          lowAttendanceStudents={lowAttendanceStudents}
          highAttendanceStudents={highAttendanceStudents}
        />

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
      </div>
    </div>
  )
}
