"use client"

import { useState, useEffect } from "react"
import { FileText } from "lucide-react"

interface PopupNoticeProps {
  message?: string
  duration?: number
}

export function PopupNotice({ message = "Read Terms and Condition", duration = 4500 }: PopupNoticeProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(true)

  useEffect(() => {
    // Small delay before showing for smooth entrance
    const showTimer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    // Auto-hide after duration
    const hideTimer = setTimeout(() => {
      setIsVisible(false)
    }, duration)

    // Remove from DOM after fade-out animation completes
    const removeTimer = setTimeout(() => {
      setShouldRender(false)
    }, duration + 500)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      clearTimeout(removeTimer)
    }
  }, [duration])

  if (!shouldRender) return null

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        flex items-center gap-3
        px-4 py-3
        bg-background/80 backdrop-blur-md
        border border-border
        rounded-xl
        shadow-lg shadow-black/10
        transition-all duration-500 ease-out
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
      `}
    >
      <div className="p-2 rounded-lg bg-primary/10">
        <FileText className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">{message}</span>
    </div>
  )
}
