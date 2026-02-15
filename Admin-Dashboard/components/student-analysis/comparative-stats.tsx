"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, Users, Award, BarChart3, Sigma } from "lucide-react"

interface ComparativeStatsProps {
  studentMarks: number
  mean: number
  median: number
  stdDev: number
  zScore: number
  rank: number
  totalStudents: number
}

export function ComparativeStats({
  studentMarks,
  mean,
  median,
  stdDev,
  zScore,
  rank,
  totalStudents,
}: ComparativeStatsProps) {
  const getTrend = (value: number, reference: number) => {
    if (value > reference) return { icon: TrendingUp, color: "text-green-600", label: "Above" }
    if (value < reference) return { icon: TrendingDown, color: "text-red-600", label: "Below" }
    return { icon: Minus, color: "text-yellow-600", label: "At" }
  }

  const meanTrend = getTrend(studentMarks, mean)
  const medianTrend = getTrend(studentMarks, median)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Comparative Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Class Average */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Class Average</span>
            </div>
            <p className="text-2xl font-bold">{mean}</p>
            <div className={`flex items-center gap-1 text-xs ${meanTrend.color}`}>
              <meanTrend.icon className="h-3 w-3" />
              <span>
                {meanTrend.label} average by {Math.abs(studentMarks - mean).toFixed(1)}
              </span>
            </div>
          </div>

          {/* Class Median */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Minus className="h-4 w-4" />
              <span className="text-xs">Class Median</span>
            </div>
            <p className="text-2xl font-bold">{median}</p>
            <div className={`flex items-center gap-1 text-xs ${medianTrend.color}`}>
              <medianTrend.icon className="h-3 w-3" />
              <span>
                {medianTrend.label} median by {Math.abs(studentMarks - median).toFixed(1)}
              </span>
            </div>
          </div>

          {/* Standard Deviation */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sigma className="h-4 w-4" />
              <span className="text-xs">Std. Deviation</span>
            </div>
            <p className="text-2xl font-bold">{stdDev}</p>
            <p className="text-xs text-muted-foreground">Class spread indicator</p>
          </div>

          {/* Z-Score */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Z-Score</span>
            </div>
            <p className={`text-2xl font-bold ${zScore >= 0 ? "text-green-600" : "text-red-600"}`}>
              {zScore > 0 ? "+" : ""}
              {zScore}
            </p>
            <p className="text-xs text-muted-foreground">{zScore >= 0 ? "Above" : "Below"} class mean</p>
          </div>

          {/* Rank */}
          <div className="bg-primary/10 rounded-lg p-4 space-y-2 col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4" />
                <span className="text-xs">Class Rank</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-xs">{totalStudents} students</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-primary">#{rank}</p>
              <p className="text-sm text-muted-foreground">out of {totalStudents}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
