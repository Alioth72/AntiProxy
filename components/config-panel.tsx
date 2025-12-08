"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Video, Mic, MicOff, VideoOff, ArrowRight } from "lucide-react"

interface ConfigPanelProps {
  onStart: (config: ConfigState) => void
}

export interface ConfigState {
  roomName: string
  userName: string
  userEmail: string
  startWithVideoMuted: boolean
  startWithAudioMuted: boolean
  jwtToken: string
}

const ANTIPROXY_JWT =
  "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtYzgzNTEzY2Q3NzE2NDk1YmI3YmZlMjkwM2MxOTEzMzcvZTZmZjhhLVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NjUxODAyNDIsImV4cCI6MTc2NTE4NzQ0MiwibmJmIjoxNzY1MTgwMjM3LCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtYzgzNTEzY2Q3NzE2NDk1YmI3YmZlMjkwM2MxOTEzMzciLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOnRydWUsImZpbGUtdXBsb2FkIjp0cnVlLCJvdXRib3VuZC1jYWxsIjp0cnVlLCJzaXAtb3V0Ym91bmQtY2FsbCI6ZmFsc2UsInRyYW5zY3JpcHRpb24iOnRydWUsImxpc3QtdmlzaXRvcnMiOmZhbHNlLCJyZWNvcmRpbmciOnRydWUsImZsaXAiOmZhbHNlfSwidXNlciI6eyJoaWRkZW4tZnJvbS1yZWNvcmRlciI6ZmFsc2UsIm1vZGVyYXRvciI6dHJ1ZSwibmFtZSI6InZpdmphaW4yMDA3IiwiaWQiOiJnb29nbGUtb2F1dGgyfDExNDAyMDQ5MDkzMzQwOTQ0MDQ4NCIsImF2YXRhciI6IiIsImVtYWlsIjoidml2amFpbjIwMDdAZ21haWwuY29tIn19LCJyb29tIjoiKiJ9.dqX9wAF5WzEwcYvdMsbe9DpgfjFLspPM4DU8ORZBQZve69btn3HB5fpyZ8yaBWeh8ILHpOwVYDjZqJTTGvSvoyxFHxnH7Jedte85R-4-3e6QbTeRa28ljqmtb1rmQ1E9qVWsCpniODTMzq8sX0KiYy77_Jiuhius0RzXZM5XWZd5FjLKVTSO9S3AMQZy7MRW3GtUUUfd0qw3Vx-Ymg7Q0YzyIYVXPT1PSeFUVa8BNLnFsgWcit7oAvv2dbEc_kfmCyFo4oO9Vr8ysmAcQD9W400VnGNnA7kvnh3pmpqP8WnYXj7ACPC0pNVc_-NTTWlLnoiHxlCvEUnSDBFDqi4TgA"

export function ConfigPanel({ onStart }: ConfigPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [config, setConfig] = useState<ConfigState>({
    roomName: "",
    userName: "",
    userEmail: "",
    startWithVideoMuted: false,
    startWithAudioMuted: false,
    jwtToken: ANTIPROXY_JWT,
  })

  const handleConfigChange = useCallback((key: keyof ConfigState, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleStart = useCallback(() => {
    if (!config.roomName.trim()) {
      alert("Please enter a meeting room name")
      return
    }
    if (!config.userName.trim()) {
      alert("Please enter your display name")
      return
    }

    setIsSubmitting(true)
    onStart(config)
  }, [config, onStart])

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-2xl">
      <CardContent className="p-6 sm:p-8 space-y-6">
        {/* Room Name Input */}
        <div className="space-y-2">
          <Label htmlFor="room-name" className="text-sm font-medium text-foreground">
            Meeting Room
          </Label>
          <Input
            id="room-name"
            placeholder="Enter room name (e.g., team-standup)"
            value={config.roomName}
            onChange={(e) => handleConfigChange("roomName", e.target.value)}
            className="h-12 bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={isSubmitting}
          />
        </div>

        {/* Display Name Input */}
        <div className="space-y-2">
          <Label htmlFor="user-name" className="text-sm font-medium text-foreground">
            Your Name
          </Label>
          <Input
            id="user-name"
            placeholder="Enter your display name"
            value={config.userName}
            onChange={(e) => handleConfigChange("userName", e.target.value)}
            className="h-12 bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={isSubmitting}
          />
        </div>

        {/* Email (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="user-email" className="text-sm font-medium text-foreground">
            Email (Optional)
          </Label>
          <Input
            id="user-email"
            type="email"
            placeholder="your@email.com"
            value={config.userEmail}
            onChange={(e) => handleConfigChange("userEmail", e.target.value)}
            className="h-12 bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={isSubmitting}
          />
        </div>

        {/* Media Settings */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleConfigChange("startWithVideoMuted", !config.startWithVideoMuted)}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
              config.startWithVideoMuted
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : "bg-primary/10 border-primary/30 text-primary"
            }`}
          >
            {config.startWithVideoMuted ? <VideoOff size={18} /> : <Video size={18} />}
            <span className="text-sm font-medium">{config.startWithVideoMuted ? "Video Off" : "Video On"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleConfigChange("startWithAudioMuted", !config.startWithAudioMuted)}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
              config.startWithAudioMuted
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : "bg-primary/10 border-primary/30 text-primary"
            }`}
          >
            {config.startWithAudioMuted ? <MicOff size={18} /> : <Mic size={18} />}
            <span className="text-sm font-medium">{config.startWithAudioMuted ? "Mic Off" : "Mic On"}</span>
          </button>
        </div>

        {/* Join Button */}
        <Button
          onClick={handleStart}
          disabled={isSubmitting || !config.roomName.trim() || !config.userName.trim()}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Join Meeting
              <ArrowRight size={20} />
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
