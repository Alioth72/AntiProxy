"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from "recharts"

interface GaussianChartProps {
  mean: number
  stdDev: number
  studentMarks: number
  maxMarks: number
}

export function GaussianChart({ mean, stdDev, studentMarks, maxMarks }: GaussianChartProps) {
  const data = useMemo(() => {
    const points: { x: number; y: number }[] = []
    const effectiveStdDev = stdDev > 0 ? stdDev : 10

    // Generate points for the Gaussian curve from 0 to maxMarks
    for (let x = 0; x <= maxMarks; x += 1) {
      const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(effectiveStdDev, 2))
      const y = Math.exp(exponent)
      points.push({ x, y: y * 100 })
    }
    return points
  }, [mean, stdDev, maxMarks])

  const studentY = useMemo(() => {
    const effectiveStdDev = stdDev > 0 ? stdDev : 10
    const exponent = -Math.pow(studentMarks - mean, 2) / (2 * Math.pow(effectiveStdDev, 2))
    return Math.exp(exponent) * 100
  }, [mean, stdDev, studentMarks])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Gaussian Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="gaussianGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="x"
                type="number"
                domain={[0, maxMarks]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                label={{ value: "Marks", position: "bottom", fontSize: 12, offset: 0 }}
              />
              <YAxis hide domain={[0, 110]} />
              <Tooltip
                formatter={(value: number) => [value.toFixed(2), "Density"]}
                labelFormatter={(label) => `Marks: ${label}`}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="y"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#gaussianGradient)"
                isAnimationActive={true}
                animationDuration={1000}
              />
              {/* Mean line */}
              <ReferenceLine
                x={mean}
                stroke="#6b7280"
                strokeDasharray="5 5"
                label={{
                  value: `Mean: ${mean.toFixed(1)}`,
                  position: "top",
                  fontSize: 11,
                  fill: "#6b7280",
                }}
              />
              {/* Student position dot */}
              <ReferenceDot x={studentMarks} y={studentY} r={8} fill="#f97316" stroke="white" strokeWidth={2} />
              {/* Student position line */}
              <ReferenceLine x={studentMarks} stroke="#f97316" strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Distribution Curve</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Student Position ({studentMarks})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
