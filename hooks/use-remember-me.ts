"use client"

/**
 * Custom hook to manage the "Remember me" state for authentication
 */
import { useState, useEffect } from "react"
import { getRememberMe, setRememberMe } from "@/lib/session-persistence"

export function useRememberMe() {
  const [rememberMe, setRememberMeState] = useState<boolean>(() => getRememberMe())

  useEffect(() => {
    // Update the stored preference whenever it changes
    setRememberMe(rememberMe)
  }, [rememberMe])

  return {
    rememberMe,
    setRememberMe: setRememberMeState,
  }
}
