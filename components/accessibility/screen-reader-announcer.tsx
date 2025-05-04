"use client"

import type React from "react"
import { useRef, createContext, useContext } from "react"

type AnnouncementPriority = "polite" | "assertive"

interface ScreenReaderAnnouncerContextType {
  announce: (message: string, priority?: AnnouncementPriority) => void
}

const ScreenReaderAnnouncerContext = createContext<ScreenReaderAnnouncerContextType | undefined>(undefined)

export function ScreenReaderAnnouncerProvider({ children }: { children: React.ReactNode }) {
  const politeAnnouncerRef = useRef<HTMLDivElement>(null)
  const assertiveAnnouncerRef = useRef<HTMLDivElement>(null)

  const announce = (message: string, priority: AnnouncementPriority = "polite") => {
    const announcerRef = priority === "assertive" ? assertiveAnnouncerRef : politeAnnouncerRef

    if (announcerRef.current) {
      // Clear the announcer first
      announcerRef.current.textContent = ""

      // Use requestAnimationFrame to ensure the DOM has time to update
      window.requestAnimationFrame(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message
        }
      })
    }
  }

  return (
    <ScreenReaderAnnouncerContext.Provider value={{ announce }}>
      {/* Polite announcer for non-urgent updates */}
      <div
        ref={politeAnnouncerRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        data-testid="polite-announcer"
      />

      {/* Assertive announcer for urgent updates */}
      <div
        ref={assertiveAnnouncerRef}
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="assertive-announcer"
      />

      {children}
    </ScreenReaderAnnouncerContext.Provider>
  )
}

export function useScreenReaderAnnouncer() {
  const context = useContext(ScreenReaderAnnouncerContext)

  if (context === undefined) {
    throw new Error("useScreenReaderAnnouncer must be used within a ScreenReaderAnnouncerProvider")
  }

  return context
}

// Component for regions that need to announce their content changes
export function LiveRegion({
  children,
  priority = "polite",
  atomic = true,
  relevant = "additions text",
  id,
}: {
  children: React.ReactNode
  priority?: AnnouncementPriority
  atomic?: boolean
  relevant?: "additions" | "removals" | "text" | "all" | "additions text"
  id?: string
}) {
  return (
    <div aria-live={priority} aria-atomic={atomic} aria-relevant={relevant} id={id}>
      {children}
    </div>
  )
}
