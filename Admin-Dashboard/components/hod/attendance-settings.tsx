"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Plus, Trash2, AlertTriangle } from "lucide-react"

interface AttendanceRange {
  id: string
  minPercent: number
  maxPercent: number
  passingCriteria: number
  warningThreshold: number
  remarks: string
}

export function AttendanceSettings() {
  const [ranges, setRanges] = useState<AttendanceRange[]>([
    {
      id: "1",
      minPercent: 0,
      maxPercent: 75,
      passingCriteria: 33,
      warningThreshold: 50,
      remarks: "Low attendance range - minimum passing criteria applied",
    },
    {
      id: "2",
      minPercent: 75,
      maxPercent: 100,
      passingCriteria: 55,
      warningThreshold: 70,
      remarks: "Good attendance range - standard passing criteria",
    },
  ])

  const [enableNotifications, setEnableNotifications] = useState(true)

  const addRange = () => {
    const newRange: AttendanceRange = {
      id: Date.now().toString(),
      minPercent: 0,
      maxPercent: 50,
      passingCriteria: 40,
      warningThreshold: 60,
      remarks: "Under Development",
    }
    setRanges([...ranges, newRange])
  }

  const removeRange = (id: string) => {
    setRanges(ranges.filter((r) => r.id !== id))
  }

  const updateRange = (id: string, field: keyof AttendanceRange, value: number | string) => {
    setRanges(ranges.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  return (
    <Card className="border border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Attendance Passing Criteria Settings</CardTitle>
              <CardDescription>Configure attendance ranges and passing criteria percentages</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
            Under Development
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div>
            <Label className="text-sm font-medium">Enable Notifications</Label>
            <p className="text-xs text-muted-foreground mt-1">Send automatic alerts to students below threshold</p>
          </div>
          <Switch checked={enableNotifications} onCheckedChange={setEnableNotifications} />
        </div>

        {/* Attendance Ranges */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Attendance Ranges & Passing Criteria</Label>
            <Button variant="outline" size="sm" onClick={addRange} className="gap-2 bg-transparent">
              <Plus className="w-4 h-4" />
              Add New Range
            </Button>
          </div>

          <div className="space-y-4">
            {ranges.map((range, index) => (
              <div key={range.id} className="p-4 rounded-lg border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Range {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {range.minPercent}% - {range.maxPercent}%
                    </Badge>
                    {ranges.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRange(range.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Range Start (%)</Label>
                    <Input
                      type="number"
                      value={range.minPercent}
                      onChange={(e) => updateRange(range.id, "minPercent", Number.parseInt(e.target.value) || 0)}
                      min={0}
                      max={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Range End (%)</Label>
                    <Input
                      type="number"
                      value={range.maxPercent}
                      onChange={(e) => updateRange(range.id, "maxPercent", Number.parseInt(e.target.value) || 0)}
                      min={0}
                      max={100}
                    />
                  </div>
                </div>

                <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border">
                  <Label className="text-xs font-medium">Passing Criteria (%)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={range.passingCriteria}
                      onChange={(e) => updateRange(range.id, "passingCriteria", Number.parseInt(e.target.value) || 0)}
                      min={0}
                      max={100}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">
                      Students need {range.passingCriteria}% to pass in this attendance range
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Under Development</p>
                </div>

                {/* Warning Threshold */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Warning Threshold</Label>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-sm font-medium">{range.warningThreshold}%</span>
                    </div>
                  </div>
                  <Slider
                    value={[range.warningThreshold]}
                    onValueChange={(value) => updateRange(range.id, "warningThreshold", value[0])}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Under Development</p>
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <Label className="text-xs">Remarks</Label>
                  <Textarea
                    value={range.remarks}
                    onChange={(e) => updateRange(range.id, "remarks", e.target.value)}
                    placeholder="Add remarks for this range..."
                    className="h-20"
                  />
                  <p className="text-xs text-muted-foreground">Under Development</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button className="w-full" disabled>
          Save Settings (Under Development)
        </Button>
      </CardContent>
    </Card>
  )
}
