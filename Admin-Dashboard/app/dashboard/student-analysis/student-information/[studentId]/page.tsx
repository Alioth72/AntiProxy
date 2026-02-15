"use client"

import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Mail, BookOpen, User, Building, GraduationCap } from "lucide-react"
import { getStudentById, getCourseById, getStudentEnrollments, type Course } from "@/lib/mock-data/student-analysis"

export default function StudentInformationPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.studentId as string

  const student = getStudentById(studentId)
  const enrollments = student ? getStudentEnrollments(student.id) : []

  if (!student) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">Student Not Found</h2>
        <p className="text-muted-foreground mb-4">The student you are looking for does not exist.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  const enrolledCourseDetails = student.enrolledCourses
    .map((courseId) => getCourseById(courseId))
    .filter(Boolean) as Course[]

  const handleCourseClick = (courseId: string) => {
    router.push(`/dashboard/student-analysis/student/${student.id}/course/${courseId}`)
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
              {student.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
              <p className="text-sm text-muted-foreground">{student.rollNo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Student Info Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">University Roll Number</p>
                    <p className="text-sm font-medium">{student.universityRollNo}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Section</p>
                    <p className="text-sm font-medium">Section {student.section}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
                    <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Department</p>
                      <p className="text-sm font-medium">{student.department}</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Email</p>
                      <p className="text-sm font-medium">{student.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enrolled Courses Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Enrolled Courses ({enrolledCourseDetails.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {enrolledCourseDetails.map((course, idx) => {
                    const enrollment = enrollments.find((e) => e.courseId === course.id)
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card
                          className="cursor-pointer hover:bg-muted/50 transition-colors group border-muted"
                          onClick={() => handleCourseClick(course.id)}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {course.code}
                                </Badge>
                                <span className="font-medium text-sm">{course.name}</span>
                              </div>
                              {enrollment && (
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <GraduationCap className="h-3 w-3" />
                                    <span>
                                      Marks: {enrollment.marks}/{enrollment.maxMarks}
                                    </span>
                                  </div>
                                  <span>|</span>
                                  <span>Attendance: {enrollment.attendancePercentage}%</span>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="group-hover:translate-x-1 transition-transform"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
