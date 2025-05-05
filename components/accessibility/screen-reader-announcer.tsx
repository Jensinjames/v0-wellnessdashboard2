"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

type AnnouncementPolitenessSetting = "polite" | "assertive"

interface ScreenReaderAnnouncerContextType {
  announce: (message: string, politeness?: AnnouncementPolitenessSetting) => void
}

const ScreenReaderAnnouncerContext = createContext<ScreenReaderAnnouncerContextType | undefined>(undefined)

export function useScreenReaderAnnouncer() {
  const context = useContext(ScreenReaderAnnouncerContext)
  if (context === undefined) {
    throw new Error("useScreenReaderAnnouncer must be used within a ScreenReaderAnnouncerProvider")
  }
  return context
}

interface LiveRegionProps {
  children: React.ReactNode
  priority?: AnnouncementPolitenessSetting
  className?: string
}

export function LiveRegion({ children, priority = "polite", className = "" }: LiveRegionProps) {
  return (
    <div aria-live={priority} aria-atomic="true" className={`sr-only ${className}`}>
      {children}
    </div>
  )
}

export function ScreenReaderAnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [politeAnnouncement, setPoliteAnnouncement] = useState("")
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState("")

  const announce = (message: string, politeness: AnnouncementPolitenessSetting = "polite") => {
    if (politeness === "assertive") {
      setAssertiveAnnouncement("")
      setTimeout(() => setAssertiveAnnouncement(message), 50)
    } else {
      setPoliteAnnouncement("")
      setTimeout(() => setPoliteAnnouncement(message), 50)
    }
  }

  return (
    <ScreenReaderAnnouncerContext.Provider value={{ announce }}>
      {children}
      <div aria-live="polite" className="sr-only" aria-atomic="true">
        {politeAnnouncement}
      </div>
      <div aria-live="assertive" className="sr-only" aria-atomic="true">
        {assertiveAnnouncement}
      </div>
    </ScreenReaderAnnouncerContext.Provider>
  )
}
