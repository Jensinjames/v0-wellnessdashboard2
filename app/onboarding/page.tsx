"use client"

import { useEffect, useState } from "react"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"

function OnboardingContent() {
  const { currentStep, isComplete, completeOnboarding } = useOnboarding()
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

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

  // Handle errors gracefully
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
          <Button onClick={() => setError(null)}>Try Again</Button>
        </div>
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
    try {
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
          return <GoalsSetupStep onError={(err) => setError(err)} />
        case 6:
          return <CompletionStep />
        default:
          return <WelcomeStep />
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred")
      return null
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
