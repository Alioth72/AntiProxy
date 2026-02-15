"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Student } from "@/lib/mock-data/student-analysis"

interface StudentCardProps {
  student: Student
  index: number
}

export function StudentCard({ student, index }: StudentCardProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/dashboard/student-analysis/student-information/${student.id}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50 group"
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {student.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {student.name}
                </h3>
                <p className="text-sm text-muted-foreground">{student.rollNo}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {student.section}
            </Badge>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span>{student.department}</span>
            <span className="text-primary/60">|</span>
            <span>{student.universityRollNo}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
