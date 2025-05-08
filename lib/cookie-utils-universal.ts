import { cookies as nextCookies } from "next/headers"
import { parseCookies, setCookie as setNextCookie, destroyCookie } from "nookies"

// Check if we're in a middleware environment
const isMiddleware = (req: any) => {
  return req && req.cookies && typeof req.cookies.get === "function"
}

// Universal cookie interface that works in both App Router and Pages Router
export const cookies = {
  // Get a cookie value
  get: (name: string, options?: { req?: any; res?: any }) => {
    // Handle middleware request
    if (options?.req && isMiddleware(options.req)) {
      return options.req.cookies.get(name)?.value
    }

    // Server-side in App Router
    if (typeof window === "undefined" && !options?.req) {
      try {
        // Try to use next/headers (only works in App Router server components)
        return nextCookies().get(name)?.value
      } catch (e) {
        // Fall back to nookies if next/headers is not available
        return null
      }
    }

    // Server-side in Pages Router
    if (typeof window === "undefined" && options?.req) {
      // Otherwise use nookies
      const cookies = parseCookies({ req: options.req })
      return cookies[name]
    }

    // Client-side
    if (typeof window !== "undefined") {
      const cookies = parseCookies()
      return cookies[name]
    }

    return null
  },

  // Set a cookie
  set: (
    name: string,
    value: string,
    options?: {
      req?: any
      res?: any
      maxAge?: number
      path?: string
      domain?: string
      secure?: boolean
    },
  ) => {
    // Handle middleware response
    if (options?.res && options?.req && isMiddleware(options.req)) {
      options.res.cookies.set({
        name,
        value,
        maxAge: options?.maxAge,
        path: options?.path || "/",
        domain: options?.domain,
        secure: options?.secure,
      })
      return true
    }

    // Server-side in App Router
    if (typeof window === "undefined" && !options?.res) {
      try {
        // Try to use next/headers (only works in App Router server components)
        nextCookies().set(name, value, {
          maxAge: options?.maxAge,
          path: options?.path || "/",
          domain: options?.domain,
          secure: options?.secure,
        })
        return true
      } catch (e) {
        // Can't set cookies without response object outside of App Router
        return false
      }
    }

    // Server-side in Pages Router
    if (typeof window === "undefined" && options?.res) {
      // Otherwise use nookies
      setNextCookie({ res: options.res, req: options.req }, name, value, {
        maxAge: options?.maxAge,
        path: options?.path || "/",
        domain: options?.domain,
        secure: options?.secure,
      })
      return true
    }

    // Client-side
    if (typeof window !== "undefined") {
      setNextCookie(null, name, value, {
        maxAge: options?.maxAge,
        path: options?.path || "/",
        domain: options?.domain,
        secure: options?.secure,
      })
      return true
    }

    return false
  },

  // Remove a cookie
  remove: (
    name: string,
    options?: {
      req?: any
      res?: any
      path?: string
      domain?: string
    },
  ) => {
    // Handle middleware response
    if (options?.res && options?.req && isMiddleware(options.req)) {
      options.res.cookies.set({
        name,
        value: "",
        maxAge: 0,
        path: options?.path || "/",
        domain: options?.domain,
      })
      return true
    }

    // Server-side in App Router
    if (typeof window === "undefined" && !options?.res) {
      try {
        // Try to use next/headers (only works in App Router server components)
        nextCookies().set(name, "", { maxAge: 0, path: options?.path || "/" })
        return true
      } catch (e) {
        // Can't set cookies without response object outside of App Router
        return false
      }
    }

    // Server-side in Pages Router
    if (typeof window === "undefined" && options?.res) {
      // Otherwise use nookies
      destroyCookie({ res: options.res, req: options.req }, name, {
        path: options?.path || "/",
        domain: options?.domain,
      })
      return true
    }

    // Client-side
    if (typeof window !== "undefined") {
      destroyCookie(null, name, {
        path: options?.path || "/",
        domain: options?.domain,
      })
      return true
    }

    return false
  },
}
