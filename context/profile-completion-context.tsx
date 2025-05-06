"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "./auth-context"
import { isProfileComplete } from "@/utils/profile-utils"

interface ProfileCompletionContextType {
  isComplete: boolean
  isSkipped: boolean
  markAsComplete: () => void
  skipCompletion: () => void
}

const ProfileCompletionContext = createContext<ProfileCompletionContextType | undefined>(undefined)

export function ProfileCompletionProvider({ children }: { children: React.ReactNode }) {
  const { profile, user } = useAuth()
  const [isComplete, setIsComplete] = useState(false)
  const [isSkipped, setIsSkipped] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Check if profile is complete
  useEffect(() => {
    if (profile) {
      const complete = isProfileComplete(profile)
      setIsComplete(complete)

      // Check if user has skipped profile completion
      const skipped = localStorage.getItem(`profile-completion-skipped-${profile.id}`) === "true"
      setIsSkipped(skipped)

      // If not complete and not skipped, and not already on the completion page,
      // redirect to profile completion
      if (!complete && !skipped && user && pathname !== "/profile/complete") {
        // Don't redirect if on auth pages
        if (!pathname?.startsWith("/auth/")) {
          router.push("/profile/complete")
        }
      }
    }
  }, [profile, user, router, pathname])

  // Mark profile as complete
  const markAsComplete = () => {
    setIsComplete(true)
    if (profile) {
      localStorage.removeItem(`profile-completion-skipped-${profile.id}`)
    }
  }

  // Skip profile completion
  const skipCompletion = () => {
    setIsSkipped(true)
    if (profile) {
      localStorage.setItem(`profile-completion-skipped-${profile.id}`, "true")
    }
    router.push("/dashboard")
  }

  return (
    <ProfileCompletionContext.Provider value={{ isComplete, isSkipped, markAsComplete, skipCompletion }}>
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
