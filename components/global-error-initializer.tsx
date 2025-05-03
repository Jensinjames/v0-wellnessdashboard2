"use client"

import { useEffect } from "react"
import { setupGlobalErrorHandlers } from "@/lib/global-error-handler"

/**
 * Component that initializes global error handlers on mount.
 * This should be included near the root of your application.
 */
export function GlobalErrorInitializer() {
  useEffect(() => {
    // Set up global error handlers when the component mounts
    setupGlobalErrorHandlers()
  }, [])

  // This component doesn't render anything
  return null
}
