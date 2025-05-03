"use client"

import type React from "react"

import { useWellness } from "@/context/wellness-context"
import { useTracking } from "@/context/tracking-context"
import { useSettings } from "@/context/settings-context"

export function LoadingState({ children }: { children: React.ReactNode }) {
  const { isLoading: wellnessLoading } = useWellness()
  const { isLoading: trackingLoading } = useTracking()
  const { isLoading: settingsLoading } = useSettings()

  const isLoading = wellnessLoading || trackingLoading || settingsLoading

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
