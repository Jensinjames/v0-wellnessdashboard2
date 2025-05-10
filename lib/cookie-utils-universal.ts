import { cookies as nextCookies } from "next/headers"

// Universal cookie interface for App Router
export const cookies = {
  // Get a cookie value
  get: (name: string) => {
    try {
      // Use next/headers (only works in App Router server components)
      return nextCookies().get(name)?.value
    } catch (e) {
      console.error("Error getting cookie:", e)
      return null
    }
  },

  // Set a cookie
  set: (
    name: string,
    value: string,
    options?: {
      maxAge?: number
      path?: string
      domain?: string
      secure?: boolean
    },
  ) => {
    try {
      // Use next/headers (only works in App Router server components)
      nextCookies().set(name, value, {
        maxAge: options?.maxAge,
        path: options?.path || "/",
        domain: options?.domain,
        secure: options?.secure,
      })
      return true
    } catch (e) {
      console.error("Error setting cookie:", e)
      return false
    }
  },

  // Remove a cookie
  remove: (
    name: string,
    options?: {
      path?: string
      domain?: string
    },
  ) => {
    try {
      // Use next/headers (only works in App Router server components)
      nextCookies().set(name, "", { maxAge: 0, path: options?.path || "/" })
      return true
    } catch (e) {
      console.error("Error removing cookie:", e)
      return false
    }
  },
}
