"use client"

import { useEffect, useRef } from "react"
import { useWellness } from "@/context/wellness-context"
import { useTracking } from "@/context/tracking-context"
import { useSettings } from "@/context/settings-context"
import { useTheme } from "next-themes"

/**
 * This component handles synchronization between different state contexts
 * to ensure state integrity across the application
 */
export function StateSynchronizer() {
  const { settings } = useSettings()
  const { setTheme } = useTheme()
  const { isLoading: wellnessLoading } = useWellness()
  const { isLoading: trackingLoading } = useTracking()

  // Track if we've synchronized theme
  const themeSynced = useRef(false)

  // Sync theme with settings
  useEffect(() => {
    if (!themeSynced.current && settings.theme) {
      setTheme(settings.theme)
      themeSynced.current = true
    }
  }, [settings.theme, setTheme])

  // This component doesn't render anything
  return null
}
