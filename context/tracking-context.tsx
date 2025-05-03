"use client"

import type React from "react"

import { createContext, useContext, useCallback, useMemo, useRef, useEffect } from "react"
import { useWellness } from "./wellness-context"
import type { CategoryId } from "@/types/wellness"
import { usePersistentState, useStableCallback } from "@/lib/state-utils"

// Types for tracking
export interface TrackingSession {
  id: string
  categoryId: CategoryId
  metricId: string
  startTime: Date
  endTime?: Date
  duration: number // in milliseconds
  isActive: boolean
  notes?: string
}

interface TrackingContextType {
  activeSessions: TrackingSession[]
  recentSessions: TrackingSession[]
  isLoading: boolean
  startTracking: (categoryId: CategoryId, metricId: string, notes?: string) => string
  pauseTracking: (sessionId: string) => void
  resumeTracking: (sessionId: string) => void
  stopTracking: (sessionId: string) => void
  discardTracking: (sessionId: string) => void
  updateNotes: (sessionId: string, notes: string) => void
  getSessionById: (sessionId: string) => TrackingSession | undefined
  getTotalTrackedTimeToday: (categoryId: CategoryId, metricId: string) => number // in milliseconds
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined)

// Number of recent sessions to keep in memory
const MAX_RECENT_SESSIONS = 20

// Local storage keys
const ACTIVE_SESSIONS_KEY = "wellness_active_sessions"
const RECENT_SESSIONS_KEY = "wellness_recent_sessions"

// Helper function to parse dates in tracking sessions
function parseTrackingSessions(sessions: any[]): TrackingSession[] {
  return sessions.map((session) => ({
    ...session,
    startTime: new Date(session.startTime),
    endTime: session.endTime ? new Date(session.endTime) : undefined,
  }))
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const { addEntry } = useWellness()

  // Use persistent state for active and recent sessions
  const [activeSessions, setActiveSessions, activeSessionsLoading] = usePersistentState<TrackingSession[]>(
    ACTIVE_SESSIONS_KEY,
    [],
  )

  const [recentSessions, setRecentSessions, recentSessionsLoading] = usePersistentState<TrackingSession[]>(
    RECENT_SESSIONS_KEY,
    [],
  )

  // Track if data has been initialized
  const initialized = useRef(false)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize data if needed
  useEffect(() => {
    if (!initialized.current && !activeSessionsLoading && !recentSessionsLoading) {
      initialized.current = true
    }
  }, [activeSessionsLoading, recentSessionsLoading])

  // Update active sessions every second to keep duration current
  useEffect(() => {
    // Clear any existing interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }

    // Only set up interval if there are active sessions
    if (activeSessions.length > 0) {
      updateIntervalRef.current = setInterval(() => {
        setActiveSessions((prev) =>
          prev.map((session) => {
            if (!session.isActive) return session

            const now = new Date()
            const duration = now.getTime() - new Date(session.startTime).getTime()
            return { ...session, duration }
          }),
        )
      }, 1000)
    }

    // Clean up interval on unmount
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [activeSessions, setActiveSessions])

  // Start tracking a new activity
  const startTracking = useStableCallback(
    (categoryId: CategoryId, metricId: string, notes?: string): string => {
      const now = new Date()
      const newSession: TrackingSession = {
        id: crypto.randomUUID(),
        categoryId,
        metricId,
        startTime: now,
        duration: 0,
        isActive: true,
        notes,
      }

      setActiveSessions((prev) => [...prev, newSession])
      return newSession.id
    },
    [setActiveSessions],
  )

  // Pause an active tracking session
  const pauseTracking = useStableCallback(
    (sessionId: string) => {
      setActiveSessions((prev) =>
        prev.map((session) => {
          if (session.id === sessionId && session.isActive) {
            return { ...session, isActive: false }
          }
          return session
        }),
      )
    },
    [setActiveSessions],
  )

  // Resume a paused tracking session
  const resumeTracking = useStableCallback(
    (sessionId: string) => {
      setActiveSessions((prev) =>
        prev.map((session) => {
          if (session.id === sessionId && !session.isActive) {
            return { ...session, isActive: true }
          }
          return session
        }),
      )
    },
    [setActiveSessions],
  )

  // Stop tracking and save the session
  const stopTracking = useStableCallback(
    (sessionId: string) => {
      const session = activeSessions.find((s) => s.id === sessionId)
      if (!session) return

      const now = new Date()
      const endTime = now
      const finalDuration = session.isActive ? now.getTime() - new Date(session.startTime).getTime() : session.duration

      const completedSession: TrackingSession = {
        ...session,
        endTime,
        duration: finalDuration,
        isActive: false,
      }

      // Add to recent sessions
      setRecentSessions((prev) => {
        const updated = [completedSession, ...prev.slice(0, MAX_RECENT_SESSIONS - 1)]
        return updated
      })

      // Remove from active sessions
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId))

      // Convert duration from milliseconds to hours for the entry
      const durationHours = finalDuration / (1000 * 60 * 60)

      // Add the tracked time to the wellness entry
      addEntry({
        id: crypto.randomUUID(),
        date: new Date(),
        metrics: [
          {
            categoryId: session.categoryId,
            metricId: session.metricId,
            value: durationHours,
          },
        ],
      })
    },
    [activeSessions, addEntry, setRecentSessions, setActiveSessions],
  )

  // Discard a tracking session without saving
  const discardTracking = useCallback(
    (sessionId: string) => {
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId))
    },
    [setActiveSessions],
  )

  // Update notes for a session
  const updateNotes = useCallback(
    (sessionId: string, notes: string) => {
      setActiveSessions((prev) =>
        prev.map((session) => {
          if (session.id === sessionId) {
            return { ...session, notes }
          }
          return session
        }),
      )
    },
    [setActiveSessions],
  )

  // Get a session by ID
  const getSessionById = useCallback(
    (sessionId: string) => {
      return activeSessions.find((s) => s.id === sessionId) || recentSessions.find((s) => s.id === sessionId)
    },
    [activeSessions, recentSessions],
  )

  // Get total tracked time for a specific category and metric today
  const getTotalTrackedTimeToday = useCallback(
    (categoryId: CategoryId, metricId: string): number => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Include active sessions
      const activeTime = activeSessions
        .filter((s) => s.categoryId === categoryId && s.metricId === metricId)
        .reduce((total, session) => {
          return total + session.duration
        }, 0)

      // Include completed sessions from today
      const completedTime = recentSessions
        .filter(
          (s) =>
            s.categoryId === categoryId &&
            s.metricId === metricId &&
            s.endTime &&
            new Date(s.endTime).getTime() >= today.getTime(),
        )
        .reduce((total, session) => {
          return total + session.duration
        }, 0)

      return activeTime + completedTime
    },
    [activeSessions, recentSessions],
  )

  // Create a memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      activeSessions,
      recentSessions,
      isLoading: activeSessionsLoading || recentSessionsLoading,
      startTracking,
      pauseTracking,
      resumeTracking,
      stopTracking,
      discardTracking,
      updateNotes,
      getSessionById,
      getTotalTrackedTimeToday,
    }),
    [
      activeSessions,
      recentSessions,
      activeSessionsLoading,
      recentSessionsLoading,
      startTracking,
      pauseTracking,
      resumeTracking,
      stopTracking,
      discardTracking,
      updateNotes,
      getSessionById,
      getTotalTrackedTimeToday,
    ],
  )

  return <TrackingContext.Provider value={contextValue}>{children}</TrackingContext.Provider>
}

export function useTracking() {
  const context = useContext(TrackingContext)
  if (context === undefined) {
    throw new Error("useTracking must be used within a TrackingProvider")
  }
  return context
}
