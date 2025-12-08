"use client"

import { useEffect, useRef, useCallback, useState } from "react"

const VPAAS_ID = "vpaas-magic-cookie-c83513cd7716495bb7bfe2903c191337"

interface JitsiConfig {
  roomName: string
  parentNode: HTMLElement | null
  jwt?: string
  configOverwrite?: Record<string, any>
  interfaceConfigOverwrite?: Record<string, any>
  userInfo?: {
    displayName: string
    email?: string
  }
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any
  }
}

interface JitsiEmbedProps {
  roomName: string
  userName: string
  userEmail?: string
  startWithVideoMuted?: boolean
  startWithAudioMuted?: boolean
  onClose?: () => void
  jwt?: string
}

export function JitsiEmbed({
  roomName,
  userName,
  userEmail,
  startWithVideoMuted = false,
  startWithAudioMuted = false,
  onClose,
  jwt,
}: JitsiEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sanitizedRoomName = roomName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 50) || "DefaultRoom"

  const fullRoomName = `${VPAAS_ID}/${sanitizedRoomName}`

  // Load external API script
  useEffect(() => {
    if (window.JitsiMeetExternalAPI) {
      setIsLoading(false)
      return
    }

    const script = document.createElement("script")
    script.src = `https://8x8.vc/${VPAAS_ID}/external_api.js`
    script.async = true

    script.onload = () => {
      setIsLoading(false)
    }

    script.onerror = () => {
      setError("Failed to load meeting service")
      setIsLoading(false)
    }

    document.head.appendChild(script)
  }, [])

  // Initialize meeting
  const initializeMeeting = useCallback(() => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI || apiRef.current) {
      return
    }

    try {
      const options: JitsiConfig = {
        roomName: fullRoomName,
        parentNode: containerRef.current,
        jwt: jwt,
        userInfo: {
          displayName: userName,
          email: userEmail,
        },
        configOverwrite: {
          startWithVideoMuted,
          startWithAudioMuted,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableInsecureRoomNameWarning: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: "",
          SHOW_POWERED_BY: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          MOBILE_APP_PROMO: false,
          HIDE_INVITE_MORE_HEADER: false,
        },
      }

      const api = new window.JitsiMeetExternalAPI("8x8.vc", options)

      api.addEventListener("videoConferenceJoined", () => {
        console.log("[v0] Joined meeting successfully")
      })

      api.addEventListener("readyToClose", () => {
        if (onClose) onClose()
      })

      apiRef.current = api
    } catch (err) {
      console.error("[v0] Failed to initialize meeting:", err)
      setError("Failed to start meeting")
    }
  }, [fullRoomName, userName, userEmail, jwt, startWithVideoMuted, startWithAudioMuted, onClose])

  // Initialize when API is ready
  useEffect(() => {
    if (!isLoading && !error) {
      initializeMeeting()
    }
  }, [isLoading, error, initializeMeeting])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (apiRef.current) {
        try {
          apiRef.current.dispose()
          apiRef.current = null
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    }
  }, [])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} id="antiProxy-meeting-container" className="w-full h-full" style={{ background: "#000" }} />
  )
}
