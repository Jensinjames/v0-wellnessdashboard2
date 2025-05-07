"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { OnboardingProvider, useOnboarding } from "@/context/onboarding-context"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { WelcomeStep } from "@/components/onboarding/welcome-step"
import { GoalsStep } from "@/components/onboarding/goals-step"
import { FocusAreasStep } from "@/components/onboarding/focus-areas-step"
import { PreferencesStep } from "@/components/onboarding/preferences-step"
import { CompletionStep } from "@/components/onboarding/completion-step"
import { GoalsSetupStep } from "@/components/onboarding/goals-setup-step"
import { LoadingAnimation } from "@/components/ui/loading-animation"

function OnboardingContent() {
  const { currentStep, isComplete, completeOnboarding } = useOnboarding()
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/sign-in")
    }
  }, [user, isLoading, router])

  // Redirect if onboarding is already complete
  useEffect(() => {
    if (isComplete) {
      router.push("/dashboard")
    }
  }, [isComplete, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingAnimation size="lg" />
        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
      </div>
    )
  }

  // Determine if next button should be disabled
  const isNextDisabled = () => {
    switch (currentStep) {
      case 1: // Welcome step
        return !user?.email
      case 6: // Completion step
        return false
      default:
        return false
    }
  }

  // Render the appropriate step based on currentStep
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep />
      case 2:
        return <GoalsStep />
      case 3:
        return <FocusAreasStep />
      case 4:
        return <PreferencesStep />
      case 5:
        return <GoalsSetupStep />
      case 6:
        return <CompletionStep />
      default:
        return <WelcomeStep />
    }
  }

  // Determine if we should show the next button
  const showNextButton = currentStep < 6 && currentStep !== 5

  // Determine if we should show the skip button
  const showSkipButton = currentStep < 6 && currentStep !== 5

  // Determine the next button label
  const getNextButtonLabel = () => {
    if (currentStep === 4) return "Set Up Goals"
    return currentStep === 5 ? "Finish" : "Next"
  }

  // Handle the next button click for the final step
  const handleNext = () => {
    if (currentStep === 5) {
      completeOnboarding()
    }
  }

  return (
    <OnboardingLayout
      showBackButton={currentStep > 1}
      showNextButton={showNextButton}
      showSkipButton={showSkipButton}
      nextDisabled={isNextDisabled()}
      nextLabel={getNextButtonLabel()}
      onNext={currentStep === 5 ? handleNext : undefined}
    >
      {renderStep()}
    </OnboardingLayout>
  )
}

export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  )
}
