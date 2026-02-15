"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { NEPInsightCard } from "@/components/dashboard/nep-insight-card"
import { Brain, Info, Search } from "lucide-react"

// Same 4 students as teacher dashboard
const nepInsightsData = [
  {
    id: "1",
    studentName: "Rahul Sharma",
    rollNo: "CS2021001",
    insight: "Programming logic is weak - struggles with loop constructs and recursion",
    category: "logic" as const,
    internalMarks: 12,
    midSemMarks: 10,
    endSemMarks: 18,
    quizMarks: 4,
    attendance: 45,
  },
  {
    id: "2",
    studentName: "Priya Patel",
    rollNo: "CS2021015",
    insight: "Low attendance in core topics - missed 60% of algorithm classes",
    category: "attendance" as const,
    internalMarks: 18,
    midSemMarks: 15,
    endSemMarks: 25,
    quizMarks: 6,
    attendance: 52,
  },
  {
    id: "3",
    studentName: "Amit Kumar",
    rollNo: "CS2021023",
    insight: "Consistent underperformance in practical assessments despite good theory scores",
    category: "performance" as const,
    internalMarks: 22,
    midSemMarks: 20,
    endSemMarks: 30,
    quizMarks: 8,
    attendance: 68,
  },
  {
    id: "4",
    studentName: "Sneha Reddy",
    rollNo: "CS2021034",
    insight: "Shows improvement trend but needs focus on database concepts",
    category: "engagement" as const,
    internalMarks: 20,
    midSemMarks: 18,
    endSemMarks: 32,
    quizMarks: 7,
    attendance: 71,
  },
]

export default function AdminNEPInsightsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return nepInsightsData
    const query = searchQuery.toLowerCase().trim()
    return nepInsightsData.filter(
      (student) => student.studentName.toLowerCase().includes(query) || student.rollNo.toLowerCase().includes(query),
    )
  }, [searchQuery])

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">NEP Insights</h1>
            <p className="text-sm text-muted-foreground">AI-Powered Student Analysis</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
          Under Development
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Info Card */}
        <Card className="border border-border bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-foreground font-medium">About NEP Insights</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI-powered insights are generated using Gemini LLM based on internal marks, mid-sem marks, end-sem
                  marks, quiz scores, and attendance data. These insights help identify at-risk students and provide
                  actionable recommendations aligned with NEP 2020 guidelines.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NEP Insights Section */}
        <Card className="border border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">NEP Insights (AI-Powered)</CardTitle>
                <CardDescription>Personalized student performance analysis</CardDescription>
              </div>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search student by name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No student found</p>
                <p className="text-sm mt-1">Try searching with a different name or roll number</p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <NEPInsightCard
                  key={student.id}
                  studentName={student.studentName}
                  rollNo={student.rollNo}
                  insight={student.insight}
                  category={student.category}
                  internalMarks={student.internalMarks}
                  midSemMarks={student.midSemMarks}
                  endSemMarks={student.endSemMarks}
                  quizMarks={student.quizMarks}
                  attendance={student.attendance}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
