"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Users } from "lucide-react"

// Same dummy data as HOD Teacher Feedback
const teacherFeedbackData = [
  {
    id: "1",
    sno: 1,
    teacherName: "Dr. Rajesh Kumar",
    branch: "Computer Science",
    avgAbove75: 78,
    debarredStudents: 5,
    feedbackScore: 4.5,
  },
  {
    id: "2",
    sno: 2,
    teacherName: "Prof. Anita Sharma",
    branch: "Electronics",
    avgAbove75: 82,
    debarredStudents: 3,
    feedbackScore: 4.8,
  },
  {
    id: "3",
    sno: 3,
    teacherName: "Dr. Suresh Reddy",
    branch: "Computer Science",
    avgAbove75: 65,
    debarredStudents: 8,
    feedbackScore: 3.9,
  },
  {
    id: "4",
    sno: 4,
    teacherName: "Prof. Meera Patel",
    branch: "Information Technology",
    avgAbove75: 91,
    debarredStudents: 1,
    feedbackScore: 4.9,
  },
  {
    id: "5",
    sno: 5,
    teacherName: "Dr. Vikram Singh",
    branch: "Mechanical",
    avgAbove75: 72,
    debarredStudents: 6,
    feedbackScore: 4.2,
  },
  {
    id: "6",
    sno: 6,
    teacherName: "Prof. Lakshmi Nair",
    branch: "Computer Science",
    avgAbove75: 88,
    debarredStudents: 2,
    feedbackScore: 4.7,
  },
  {
    id: "7",
    sno: 7,
    teacherName: "Dr. Amit Verma",
    branch: "Electronics",
    avgAbove75: 70,
    debarredStudents: 7,
    feedbackScore: 4.0,
  },
  {
    id: "8",
    sno: 8,
    teacherName: "Prof. Deepa Menon",
    branch: "Information Technology",
    avgAbove75: 85,
    debarredStudents: 4,
    feedbackScore: 4.6,
  },
]

export default function AdminTeacherFeedbackPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [branchFilter, setBranchFilter] = useState("all")

  const filteredData = useMemo(() => {
    return teacherFeedbackData.filter((teacher) => {
      const matchesSearch = teacher.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesBranch = branchFilter === "all" || teacher.branch === branchFilter
      return matchesSearch && matchesBranch
    })
  }, [searchQuery, branchFilter])

  const uniqueBranches = [...new Set(teacherFeedbackData.map((t) => t.branch))]

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="flex-1 p-6 overflow-auto">
        <Card className="border border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Teacher Feedback</CardTitle>
                  <CardDescription>View and analyze teacher performance data across all departments</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                Under Development
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filter Row */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by teacher name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {uniqueBranches.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table matching image.png structure */}
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-900 hover:bg-neutral-900">
                    <TableHead className="text-white font-medium w-16">S.No</TableHead>
                    <TableHead className="text-white font-medium">Teacher Name</TableHead>
                    <TableHead className="text-white font-medium">Branch</TableHead>
                    <TableHead className="text-white font-medium text-center">Avg &gt;75%</TableHead>
                    <TableHead className="text-white font-medium text-center">Debarred Students</TableHead>
                    <TableHead className="text-white font-medium text-center">Feedback Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((teacher, index) => (
                    <TableRow key={teacher.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      <TableCell className="font-medium">{teacher.sno}</TableCell>
                      <TableCell className="font-medium">{teacher.teacherName}</TableCell>
                      <TableCell>{teacher.branch}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            teacher.avgAbove75 >= 75
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {teacher.avgAbove75}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            teacher.debarredStudents <= 3
                              ? "bg-green-50 text-green-700 border-green-200"
                              : teacher.debarredStudents <= 5
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {teacher.debarredStudents}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-medium">{teacher.feedbackScore}</span>
                          <span className="text-muted-foreground">/5</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">
              Showing {filteredData.length} of {teacherFeedbackData.length} teachers
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
