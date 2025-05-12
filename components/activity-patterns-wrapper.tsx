"use client"

import { ActivityPatterns } from "@/components/activity-patterns"
import { ScreenReaderAnnouncerProvider } from "@/components/accessibility/screen-reader-announcer"

export function ActivityPatternsWrapper() {
  return (
    <ScreenReaderAnnouncerProvider>
      <ActivityPatterns />
    </ScreenReaderAnnouncerProvider>
  )
}
