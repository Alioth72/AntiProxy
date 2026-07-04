/**
 * Decode JWT token without verification
 * Note: This is safe because we're only reading the payload for timing info
 */
export function decodeJWT(token: string): { exp: number; iat: number } | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const decoded = JSON.parse(atob(parts[1]))
    return {
      exp: decoded.exp,
      iat: decoded.iat,
    }
  } catch (error) {
    console.error("[v0] Failed to decode JWT:", error)
    return null
  }
}

/**
 * Check if token is expired or about to expire
 * @param token JWT token string
 * @param bufferSeconds Time buffer in seconds before actual expiry to consider it "expired"
 * @returns true if token is expired or will expire soon
 */
export function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  const decoded = decodeJWT(token)
  if (!decoded) return true

  const now = Math.floor(Date.now() / 1000)
  const expiryTime = decoded.exp - bufferSeconds

  return now >= expiryTime
}

/**
 * Get time until token expiry in seconds
 */
export function getTimeUntilExpiry(token: string): number {
  const decoded = decodeJWT(token)
  if (!decoded) return 0

  const now = Math.floor(Date.now() / 1000)
  return Math.max(0, decoded.exp - now)
}
