"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User } from "lucide-react"
import { MarksCard } from "@/components/student-analysis/marks-card"
import { AttendanceRing } from "@/components/student-analysis/attendance-ring"
import { GaussianChart } from "@/components/student-analysis/gaussian-chart"
import { ComparativeStats } from "@/components/student-analysis/comparative-stats"
import {
  getStudentById,
  getCourseById,
  getEnrollment,
  getCourseEnrollments,
  calculateStats,
  calculateZScore,
  calculateRank,
} from "@/lib/mock-data/student-analysis"

export default function CourseInsightsPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.studentId as string
  const courseId = params.courseId as string

  const student = getStudentById(studentId)
  const course = getCourseById(courseId)
  const enrollment = getEnrollment(studentId, courseId)
  const allEnrollments = getCourseEnrollments(courseId)

  const stats = useMemo(() => calculateStats(allEnrollments), [allEnrollments])

  const zScore = useMemo(() => {
    if (!enrollment) return 0
    return calculateZScore(enrollment.marks, stats.mean, stats.stdDev)
  }, [enrollment, stats])

  const rank = useMemo(() => {
    if (!enrollment) return 0
    const allMarks = allEnrollments.map((e) => e.marks)
    return calculateRank(enrollment.marks, allMarks)
  }, [enrollment, allEnrollments])

  if (!student || !course || !enrollment) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <p className="text-muted-foreground mb-4">Student or course data not found.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {student.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{student.name}</h1>
                <p className="text-sm text-muted-foreground">{student.rollNo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline">{course.code}</Badge>
              <span className="text-sm text-foreground">{course.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Section {student.section}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid gap-6 max-w-6xl mx-auto">
          {/* Top Row - Marks & Attendance */}
          <motion.div
            className="grid md:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MarksCard marks={enrollment.marks} maxMarks={enrollment.maxMarks} />
            <AttendanceRing
              percentage={enrollment.attendancePercentage}
              sessionsAttended={enrollment.sessionsAttended}
              totalSessions={enrollment.totalSessions}
            />
          </motion.div>

          {/* Gaussian Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <GaussianChart
              mean={stats.mean}
              stdDev={stats.stdDev}
              studentMarks={enrollment.marks}
              maxMarks={enrollment.maxMarks}
            />
          </motion.div>

          {/* Comparative Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <ComparativeStats
              studentMarks={enrollment.marks}
              mean={stats.mean}
              median={stats.median}
              stdDev={stats.stdDev}
              zScore={zScore}
              rank={rank}
              totalStudents={allEnrollments.length}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
