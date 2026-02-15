"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { StudentCard } from "@/components/student-analysis/student-card"
import { SkeletonList } from "@/components/student-analysis/skeleton-card"
import { mockCourses, getStudentsByCourseAndSection } from "@/lib/mock-data/student-analysis"

export default function StudentAnalysisPage() {
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [loading, setLoading] = useState(false)

  // Get available sections for selected course
  const availableSections = useMemo(() => {
    if (!selectedCourse) return []
    const course = mockCourses.find((c) => c.id === selectedCourse)
    return course?.sections || []
  }, [selectedCourse])

  // Get filtered students
  const filteredStudents = useMemo(() => {
    if (!selectedCourse || !selectedSection) return []
    return getStudentsByCourseAndSection(selectedCourse, selectedSection)
  }, [selectedCourse, selectedSection])

  // Reset section when course changes
  useEffect(() => {
    setSelectedSection("")
  }, [selectedCourse])

  // Simulate loading
  useEffect(() => {
    if (selectedCourse && selectedSection) {
      setLoading(true)
      const timer = setTimeout(() => setLoading(false), 500)
      return () => clearTimeout(timer)
    }
  }, [selectedCourse, selectedSection])

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Student Wise Analysis</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analyze students by course, section, marks, and attendance.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Course</span>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {mockCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Section</span>
              <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedCourse}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map((section) => (
                    <SelectItem key={section} value={section}>
                      Section {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredStudents.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {filteredStudents.length} Students
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {!selectedCourse || !selectedSection ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-muted/50 rounded-full p-6 mb-4">
              <svg className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Select Course & Section</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Choose a course and section from the dropdowns above to view student analytics.
            </p>
          </div>
        ) : loading ? (
          <SkeletonList count={6} />
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground">No students found for this selection.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCourse}-${selectedSection}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredStudents.map((student, index) => (
                <StudentCard key={student.id} student={student} index={index} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
