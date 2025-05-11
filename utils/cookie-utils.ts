/**
 * Cookie Utilities
 * Helper functions for working with cookies in Next.js
 */

// Set a cookie with the specified name, value, and options
export function setCookie(
  name: string,
  value: string,
  options: {
    maxAge?: number
    path?: string
    domain?: string
    secure?: boolean
    httpOnly?: boolean
    sameSite?: "strict" | "lax" | "none"
  } = {},
) {
  const cookieOptions = {
    maxAge: options.maxAge || 30 * 24 * 60 * 60, // 30 days by default
    path: options.path || "/",
    domain: options.domain,
    secure: options.secure !== undefined ? options.secure : process.env.NODE_ENV === "production",
    httpOnly: options.httpOnly !== undefined ? options.httpOnly : true,
    sameSite: options.sameSite || "lax",
  }

  const cookieString = `${name}=${encodeURIComponent(value)}; Max-Age=${cookieOptions.maxAge}; Path=${cookieOptions.path}${
    cookieOptions.domain ? `; Domain=${cookieOptions.domain}` : ""
  }${cookieOptions.secure ? "; Secure" : ""}${cookieOptions.httpOnly ? "; HttpOnly" : ""}; SameSite=${cookieOptions.sameSite}`

  if (typeof document !== "undefined") {
    document.cookie = cookieString
  }
}

// Get a cookie by name
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null
  }

  const cookies = document.cookie.split(";")
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    if (cookie.startsWith(name + "=")) {
      return decodeURIComponent(cookie.substring(name.length + 1))
    }
  }
  return null
}

// Delete a cookie by name
export function deleteCookie(name: string, options: { path?: string; domain?: string } = {}) {
  setCookie(name, "", {
    maxAge: -1,
    path: options.path || "/",
    domain: options.domain,
  })
}

// Store the redirect URL in a cookie
export function storeRedirectUrl(url: string) {
  setCookie("redirectUrl", url, { maxAge: 300 }) // 5 minutes
}

// Get the stored redirect URL and clear the cookie
export function getStoredRedirectUrl(): string | null {
  const url = getCookie("redirectUrl")
  if (url) {
    deleteCookie("redirectUrl")
  }
  return url
}

// Store authentication state in a cookie
export function storeAuthState(state: string) {
  setCookie("auth_state", state, { maxAge: 300 }) // 5 minutes
}

// Get the stored authentication state and clear the cookie
export function getStoredAuthState(): string | null {
  const state = getCookie("auth_state")
  if (state) {
    deleteCookie("auth_state")
  }
  return state
}
