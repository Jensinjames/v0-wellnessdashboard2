"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"
import { validateRedirectUrl, getStoredRedirectUrl } from "@/utils/redirect-manager"

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
  const navigationInProgressRef = useRef<boolean>(false)

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
      if (navigationInProgressRef.current) {
        console.warn("Navigation already in progress, ignoring request to navigate to:", path)
        return
      }

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

      // Set navigation in progress
      navigationInProgressRef.current = true

      // Navigate
      if (replace) {
        router.replace(path)
      } else {
        router.push(path)
      }

      // Reset navigation in progress after a delay
      setTimeout(() => {
        navigationInProgressRef.current = false
      }, 1000)
    },
    [pathname, router],
  )

  // Navigate back
  const goBack = useCallback(() => {
    if (navigationInProgressRef.current) {
      console.warn("Navigation already in progress, ignoring back request")
      return
    }

    navigationInProgressRef.current = true

    // Check if we have a "from" path in our state
    if (historyStateRef.current?.from) {
      router.push(historyStateRef.current.from)
      setTimeout(() => {
        navigationInProgressRef.current = false
      }, 1000)
      return
    }

    // Check if we have a returnTo query param
    const returnTo = searchParams.get("returnTo")
    if (returnTo) {
      const validatedReturnTo = validateRedirectUrl(returnTo)
      if (validatedReturnTo) {
        router.push(validatedReturnTo)
        setTimeout(() => {
          navigationInProgressRef.current = false
        }, 1000)
        return
      }
    }

    // Check for stored redirect URL
    const storedRedirect = getStoredRedirectUrl()
    if (storedRedirect) {
      router.push(storedRedirect)
      setTimeout(() => {
        navigationInProgressRef.current = false
      }, 1000)
      return
    }

    // Default to browser back
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back()
      setTimeout(() => {
        navigationInProgressRef.current = false
      }, 1000)
    } else {
      // Fallback to dashboard if we can't go back
      router.push("/dashboard")
      setTimeout(() => {
        navigationInProgressRef.current = false
      }, 1000)
    }
  }, [router, searchParams])

  // Get the previous path
  const getPreviousPath = useCallback((): string | null => {
    if (historyStateRef.current?.from) {
      return historyStateRef.current.from
    }

    const returnTo = searchParams.get("returnTo")
    if (returnTo) {
      return validateRedirectUrl(returnTo)
    }

    return getStoredRedirectUrl()
  }, [searchParams])

  // Navigate to a safe destination after authentication
  const navigateAfterAuth = useCallback(
    (defaultPath = "/dashboard") => {
      if (navigationInProgressRef.current) {
        console.warn("Navigation already in progress, ignoring post-auth navigation")
        return
      }

      navigationInProgressRef.current = true

      // Check for returnTo in query params
      const returnTo = searchParams.get("redirectTo") || searchParams.get("returnTo")
      const validatedReturnTo = validateRedirectUrl(returnTo)

      // Check for stored redirect
      const storedRedirect = getStoredRedirectUrl()
      const validatedStoredRedirect = validateRedirectUrl(storedRedirect)

      // Use the first valid redirect destination
      const redirectPath = validatedReturnTo || validatedStoredRedirect || defaultPath

      // Navigate with replace to avoid back button issues
      router.replace(redirectPath)

      // Reset navigation in progress after a delay
      setTimeout(() => {
        navigationInProgressRef.current = false
      }, 1000)
    },
    [router, searchParams],
  )

  return {
    navigateTo,
    goBack,
    getPreviousPath,
    navigateAfterAuth,
    currentPath: pathname,
    isNavigating: navigationInProgressRef.current,
  }
}
