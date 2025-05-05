"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"

interface ScreenReaderAnnouncerContextType {
  announce: (message: string, politeness?: "polite" | "assertive") => void
}

const ScreenReaderAnnouncerContext = createContext<ScreenReaderAnnouncerContextType>({
  announce: () => {},
})

export function ScreenReaderAnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [politeAnnouncement, setPoliteAnnouncement] = useState("")
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState("")

  const announce = (message: string, politeness: "polite" | "assertive" = "polite") => {
    if (politeness === "polite") {
      setPoliteAnnouncement(message)
    } else {
      setAssertiveAnnouncement(message)
    }

    // Clear announcements after they've been read
    setTimeout(() => {
      if (politeness === "polite") {
        setPoliteAnnouncement("")
      } else {
        setAssertiveAnnouncement("")
      }
    }, 3000)
  }

  return (
    <ScreenReaderAnnouncerContext.Provider value={{ announce }}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {politeAnnouncement}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only" role="alert">
        {assertiveAnnouncement}
      </div>
    </ScreenReaderAnnouncerContext.Provider>
  )
}

export function useScreenReaderAnnouncer() {
  return useContext(ScreenReaderAnnouncerContext)
}
