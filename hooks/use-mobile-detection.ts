"use client"

import { useState, useEffect } from "react"

// Constants for breakpoints
export const MOBILE_BREAKPOINT = 768
export const SMALL_MOBILE_BREAKPOINT = 480

export interface MobileState {
  isMobile: boolean
  isSmallMobile: boolean
  isPortrait: boolean
}

export function useMobileDetection(): MobileState {
  const [mobileState, setMobileState] = useState<MobileState>({
    isMobile: false,
    isSmallMobile: false,
    isPortrait: true,
  })

  useEffect(() => {
    // Initial check
    const checkDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setMobileState({
        isMobile: width < MOBILE_BREAKPOINT,
        isSmallMobile: width < SMALL_MOBILE_BREAKPOINT,
        isPortrait: height > width,
      })
    }

    // Check on mount
    checkDevice()

    // Add event listeners for resize and orientation change
    window.addEventListener("resize", checkDevice)
    window.addEventListener("orientationchange", checkDevice)

    // Clean up
    return () => {
      window.removeEventListener("resize", checkDevice)
      window.removeEventListener("orientationchange", checkDevice)
    }
  }, [])

  return mobileState
}
