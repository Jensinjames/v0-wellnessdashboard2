"use client"

import type React from "react"

import { createContext, useContext, useRef } from "react"

// Create a context for the status announcer
type StatusAnnouncerContextType = {
  announce: (message: string, assertive?: boolean) => void
}

const StatusAnnouncerContext = createContext<StatusAnnouncerContextType | undefined>(undefined)

// Provider component
export function StatusAnnouncerProvider({ children }: { children: React.ReactNode }) {
  const politeRef = useRef<HTMLDivElement>(null)
  const assertiveRef = useRef<HTMLDivElement>(null)

  // Function to announce messages
  const announce = (message: string, assertive = false) => {
    const targetRef = assertive ? assertiveRef : politeRef

    if (targetRef.current) {
      // Clear previous content and set new message
      targetRef.current.textContent = ""

      // Use setTimeout to ensure screen readers recognize the change
      setTimeout(() => {
        if (targetRef.current) {
          targetRef.current.textContent = message
        }
      }, 50)
    }
  }

  return (
    <StatusAnnouncerContext.Provider value={{ announce }}>
      {/* Hidden elements for screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true" ref={politeRef}></div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true" ref={assertiveRef}></div>

      {children}
    </StatusAnnouncerContext.Provider>
  )
}

// Hook to use the announcer
export function useStatusAnnouncer() {
  const context = useContext(StatusAnnouncerContext)

  if (context === undefined) {
    throw new Error("useStatusAnnouncer must be used within a StatusAnnouncerProvider")
  }

  return context
}
