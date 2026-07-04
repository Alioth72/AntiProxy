"use client"

import { useState } from "react"
import { JitsiEmbed } from "@/components/jitsi-embed"
import { ConfigPanel, type ConfigState } from "@/components/config-panel"
import { Phone, Shield, Users, Zap } from "lucide-react"

export default function Home() {
  const [conferenceConfig, setConferenceConfig] = useState<ConfigState | null>(null)

  const handleStartConference = (config: ConfigState) => {
    console.log("[v0] Starting conference with config:", {
      roomName: config.roomName,
      userName: config.userName,
      hasJWT: !!config.jwtToken,
    })
    setConferenceConfig(config)
  }

  const handleCloseConference = () => {
    setConferenceConfig(null)
  }

  if (conferenceConfig) {
    return (
      <div className="meeting-container">
        {/* Minimal header bar */}
        <div className="meeting-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{conferenceConfig.roomName}</p>
            </div>
          </div>
          <button
            onClick={handleCloseConference}
            className="flex items-center gap-2 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-medium text-sm transition-colors"
          >
            <Phone size={16} className="rotate-[135deg]" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>

        {/* Meeting iframe container */}
        <div className="meeting-content">
          <JitsiEmbed
            roomName={conferenceConfig.roomName}
            userName={conferenceConfig.userName}
            userEmail={conferenceConfig.userEmail}
            startWithVideoMuted={conferenceConfig.startWithVideoMuted}
            startWithAudioMuted={conferenceConfig.startWithAudioMuted}
            jwt={conferenceConfig.jwtToken}
            onClose={handleCloseConference}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="join-page">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-foreground">AntiProxy</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - Hero Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
                  Connect with
                  <span className="text-primary block">Anyone, Anywhere</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-lg text-pretty">
                  Professional video conferencing with enterprise-grade security. Start meetings instantly with no
                  downloads required.
                </p>
              </div>

              {/* Feature list */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Secure</p>
                    <p className="text-sm text-muted-foreground">End-to-end encrypted</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Fast</p>
                    <p className="text-sm text-muted-foreground">Join in seconds</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Unlimited</p>
                    <p className="text-sm text-muted-foreground">No participant limits</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">HD Quality</p>
                    <p className="text-sm text-muted-foreground">Crystal clear audio/video</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Join Form */}
            <div className="lg:pl-8">
              <ConfigPanel onStart={handleStartConference} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 AntiProxy. Professional video conferencing platform.
          </p>
        </div>
      </footer>
    </div>
  )
}
