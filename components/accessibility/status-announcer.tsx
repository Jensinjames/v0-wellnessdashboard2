"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

// Define the context type
interface StatusAnnouncerContextType {
  announce: (message: string, assertive?: boolean) => void
}

// Create the context with a default value
const StatusAnnouncerContext = createContext<StatusAnnouncerContextType>({
  announce: () => {},
})

// Hook to use the status announcer
export const useStatusAnnouncer = () => useContext(StatusAnnouncerContext)

// Props for the StatusAnnouncerProvider
interface StatusAnnouncerProviderProps {
  children: React.ReactNode
}

export const StatusAnnouncerProvider: React.FC<StatusAnnouncerProviderProps> = ({ children }) => {
  const [politeMessage, setPoliteMessage] = useState("")
  const [assertiveMessage, setAssertiveMessage] = useState("")

  // Function to announce messages
  const announce = useCallback((message: string, assertive = false) => {
    if (assertive) {
      setAssertiveMessage("") // Clear first to ensure announcement
      setTimeout(() => setAssertiveMessage(message), 100)
    } else {
      setPoliteMessage("") // Clear first to ensure announcement
      setTimeout(() => setPoliteMessage(message), 100)
    }
  }, [])

  return (
    <StatusAnnouncerContext.Provider value={{ announce }}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="status-announcer-polite">
        {politeMessage}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only" data-testid="status-announcer-assertive">
        {assertiveMessage}
      </div>
    </StatusAnnouncerContext.Provider>
  )
}
