"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context" // Changed from auth-context-fixed

interface ProfileCompletionContextType {
  isComplete: boolean
  isSkipped: boolean
  markAsComplete: () => void
  skipCompletion: () => void
  resetCompletion: () => void
}

const ProfileCompletionContext = createContext<ProfileCompletionContextType | undefined>(undefined)

const STORAGE_KEY = "profile_completion_status"

export function ProfileCompletionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isComplete, setIsComplete] = useState(false)
  const [isSkipped, setIsSkipped] = useState(false)

  // Load completion status from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && user?.id) {
      const userKey = `${STORAGE_KEY}_${user.id}`
      const savedStatus = localStorage.getItem(userKey)

      if (savedStatus) {
        try {
          const { isComplete: savedIsComplete, isSkipped: savedIsSkipped } = JSON.parse(savedStatus)
          setIsComplete(savedIsComplete)
          setIsSkipped(savedIsSkipped)
        } catch (error) {
          console.error("Error parsing profile completion status:", error)
          // Reset if there's an error
          localStorage.removeItem(userKey)
        }
      }
    }
  }, [user?.id])

  // Save completion status to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined" && user?.id) {
      const userKey = `${STORAGE_KEY}_${user.id}`
      localStorage.setItem(userKey, JSON.stringify({ isComplete, isSkipped }))
    }
  }, [isComplete, isSkipped, user?.id])

  const markAsComplete = () => {
    setIsComplete(true)
    setIsSkipped(false)
  }

  const skipCompletion = () => {
    setIsSkipped(true)
  }

  const resetCompletion = () => {
    setIsComplete(false)
    setIsSkipped(false)

    if (typeof window !== "undefined" && user?.id) {
      const userKey = `${STORAGE_KEY}_${user.id}`
      localStorage.removeItem(userKey)
    }
  }

  return (
    <ProfileCompletionContext.Provider
      value={{
        isComplete,
        isSkipped,
        markAsComplete,
        skipCompletion,
        resetCompletion,
      }}
    >
      {children}
    </ProfileCompletionContext.Provider>
  )
}

export function useProfileCompletion() {
  const context = useContext(ProfileCompletionContext)
  if (context === undefined) {
    throw new Error("useProfileCompletion must be used within a ProfileCompletionProvider")
  }
  return context
}
