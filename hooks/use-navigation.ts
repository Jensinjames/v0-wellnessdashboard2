"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"

interface NavigationState {
  from?: string
  returnTo?: string
  [key: string]: any
}

export function useNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const historyStateRef = useRef<NavigationState | null>(null)

  // Initialize history state from window.history if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const state = window.history.state?.navigationState as NavigationState | undefined
        if (state) {
          historyStateRef.current = state
        }
      } catch (error) {
        console.error("Error accessing history state:", error)
      }
    }
  }, [])

  // Navigate to a new page with state
  const navigateTo = useCallback(
    (path: string, options?: { state?: NavigationState; replace?: boolean }) => {
      const { state = {}, replace = false } = options || {}

      // Store the current path as the "from" in the new state
      const navigationState: NavigationState = {
        ...state,
        from: pathname,
      }

      // Update our ref
      historyStateRef.current = navigationState

      // Store in history state
      if (typeof window !== "undefined") {
        try {
          window.history.replaceState({ ...window.history.state, navigationState }, "", window.location.href)
        } catch (error) {
          console.error("Error updating history state:", error)
        }
      }

      // Navigate
      if (replace) {
        router.replace(path)
      } else {
        router.push(path)
      }
    },
    [pathname, router],
  )

  // Navigate back
  const goBack = useCallback(() => {
    // Check if we have a "from" path in our state
    if (historyStateRef.current?.from) {
      router.push(historyStateRef.current.from)
      return
    }

    // Check if we have a returnTo query param
    const returnTo = searchParams.get("returnTo")
    if (returnTo) {
      router.push(returnTo)
      return
    }

    // Default to browser back
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back()
    } else {
      // Fallback to dashboard if we can't go back
      router.push("/dashboard")
    }
  }, [router, searchParams])

  // Get the previous path
  const getPreviousPath = useCallback((): string | null => {
    if (historyStateRef.current?.from) {
      return historyStateRef.current.from
    }

    const returnTo = searchParams.get("returnTo")
    if (returnTo) {
      return returnTo
    }

    return null
  }, [searchParams])

  return {
    navigateTo,
    goBack,
    getPreviousPath,
    currentPath: pathname,
  }
}
