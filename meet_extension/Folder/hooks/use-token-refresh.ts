"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getTimeUntilExpiry } from "@/lib/jwt-utils"

interface UseTokenRefreshOptions {
  onTokenRefresh?: (newToken: string) => void
  bufferSeconds?: number
}

export function useTokenRefresh(initialToken: string, options: UseTokenRefreshOptions = {}) {
  const { onTokenRefresh, bufferSeconds = 60 } = options
  const [token, setToken] = useState(initialToken)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refreshIntervalRef = useRef<NodeJS.Timeout>()
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()

  const refreshToken = useCallback(async () => {
    try {
      setIsRefreshing(true)
      console.log("[v0] Refreshing JWT token...")

      const response = await fetch("/api/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error("Failed to refresh token")
      }

      const data = await response.json()
      const newToken = data.token

      setToken(newToken)
      onTokenRefresh?.(newToken)

      console.log("[v0] Token refreshed successfully")
      scheduleNextRefresh(newToken)
    } catch (error) {
      console.error("[v0] Token refresh failed:", error)
      // Retry after 30 seconds if refresh fails
      refreshTimeoutRef.current = setTimeout(() => {
        refreshToken()
      }, 30000)
    } finally {
      setIsRefreshing(false)
    }
  }, [onTokenRefresh])

  const scheduleNextRefresh = useCallback(
    (currentToken: string) => {
      // Clear existing timers
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current)
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)

      const timeUntilExpiry = getTimeUntilExpiry(currentToken)
      const refreshTime = Math.max(timeUntilExpiry - bufferSeconds, 1) * 1000

      console.log(`[v0] Scheduling token refresh in ${Math.round(refreshTime / 1000)} seconds`)

      refreshTimeoutRef.current = setTimeout(() => {
        refreshToken()
      }, refreshTime)
    },
    [bufferSeconds, refreshToken],
  )

  // Initial setup
  useEffect(() => {
    if (token) {
      scheduleNextRefresh(token)
    }

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current)
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
    }
  }, [])

  return {
    token,
    isRefreshing,
    refreshToken,
  }
}
