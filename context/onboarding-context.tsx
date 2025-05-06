"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

interface OnboardingContextType {
  currentStep: number
  totalSteps: number
  isComplete: boolean
  userPreferences: UserPreferences
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  updatePreferences: (preferences: Partial<UserPreferences>) => void
  completeOnboarding: () => void
  skipOnboarding: () => void
}

export interface UserPreferences {
  name: string
  wellnessGoals: string[]
  focusAreas: string[]
  theme: "light" | "dark" | "system"
  reminderTime: string | null
  accessibilityPreferences: {
    reducedMotion: boolean
    highContrast: boolean
    largeText: boolean
  }
  animationPreferences: {
    enableAnimations: boolean
  }
}

const defaultPreferences: UserPreferences = {
  name: "",
  wellnessGoals: [],
  focusAreas: [],
  reminderTime: null,
  theme: "system",
  accessibilityPreferences: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
  },
  animationPreferences: {
    enableAnimations: true,
  },
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isComplete, setIsComplete] = useState(false)
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(defaultPreferences)
  const totalSteps = 5
  const router = useRouter()
  const { user, updateProfile } = useAuth()

  // Check if onboarding is already completed
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem(`onboarding-completed-${user?.id}`)
    if (onboardingCompleted === "true") {
      setIsComplete(true)
    }

    // Try to load saved preferences
    const savedPreferences = localStorage.getItem(`onboarding-preferences-${user?.id}`)
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences)
        setUserPreferences(parsedPreferences)
      } catch (error) {
        console.error("Failed to parse saved preferences:", error)
      }
    }
  }, [user?.id])

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      saveProgress()
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step)
      saveProgress()
    }
  }

  const updatePreferences = (preferences: Partial<UserPreferences>) => {
    setUserPreferences((prev) => {
      const updated = { ...prev, ...preferences }

      // Save to localStorage
      localStorage.setItem(`onboarding-preferences-${user?.id}`, JSON.stringify(updated))

      return updated
    })
  }

  const saveProgress = () => {
    localStorage.setItem(`onboarding-step-${user?.id}`, currentStep.toString())
  }

  const completeOnboarding = async () => {
    try {
      setIsComplete(true)
      localStorage.setItem(`onboarding-completed-${user?.id}`, "true")

      // Save user preferences to profile if authenticated
      if (user) {
        // Extract relevant data for profile update
        const { name, wellnessGoals, focusAreas, theme, accessibilityPreferences } = userPreferences

        // Update user profile with onboarding preferences
        await updateProfile({
          first_name: name.split(" ")[0] || "",
          last_name: name.split(" ").slice(1).join(" ") || "",
          preferences: {
            wellnessGoals,
            focusAreas,
            theme,
            accessibility: accessibilityPreferences,
          },
        })
      }

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to complete onboarding:", error)
    }
  }

  const skipOnboarding = () => {
    setIsComplete(true)
    localStorage.setItem(`onboarding-completed-${user?.id}`, "true")
    router.push("/dashboard")
  }

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        totalSteps,
        isComplete,
        userPreferences,
        nextStep,
        prevStep,
        goToStep,
        updatePreferences,
        completeOnboarding,
        skipOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
