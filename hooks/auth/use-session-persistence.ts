"use client"

import { useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { type PersistenceMode, clearPersistedSession } from "@/lib/auth/session-persistence"

export function useSessionPersistence() {
  const { session, persistenceMode, setPersistenceMode } = useAuth()
  const [isConfiguring, setIsConfiguring] = useState(false)

  // Update persistence mode
  const updatePersistenceMode = (mode: PersistenceMode) => {
    setIsConfiguring(true)

    try {
      setPersistenceMode(mode)
    } finally {
      setIsConfiguring(false)
    }
  }

  // Clear all sessions (sign out everywhere)
  const clearAllSessions = async () => {
    setIsConfiguring(true)

    try {
      // This would typically involve a server action to revoke all sessions
      // For now, we'll just clear the local session
      clearPersistedSession()

      // Force reload to ensure we're signed out
      window.location.href = "/auth/login"
    } finally {
      setIsConfiguring(false)
    }
  }

  return {
    persistenceMode,
    updatePersistenceMode,
    clearAllSessions,
    isConfiguring,
    hasActiveSession: !!session,
  }
}
