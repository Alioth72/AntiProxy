"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  course: string
  section: string
  onCourseChange: (value: string) => void
  onSectionChange: (value: string) => void
}

export function DashboardHeader({ course, section, onCourseChange, onSectionChange }: HeaderProps) {
  return (
    <div className="flex items-center gap-4 p-6 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Course</span>
        <Select value={course} onValueChange={onCourseChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cs101">CS101 - Programming Fundamentals</SelectItem>
            <SelectItem value="cs201">CS201 - Data Structures</SelectItem>
            <SelectItem value="cs301">CS301 - Algorithms</SelectItem>
            <SelectItem value="cs401">CS401 - Machine Learning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Section</span>
        <Select value={section} onValueChange={onSectionChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Section A</SelectItem>
            <SelectItem value="b">Section B</SelectItem>
            <SelectItem value="c">Section C</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button>Submit</Button>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
          Connected
        </Badge>
        <span className="text-sm text-muted-foreground">Teacher Dashboard</span>
      </div>
    </div>
  )
}
