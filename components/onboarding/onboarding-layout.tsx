"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useOnboarding } from "@/context/onboarding-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { motion, AnimatePresence } from "framer-motion"
import { useReducedMotion, fadeIn } from "@/utils/animation-utils"
import { AnimatedButton } from "@/components/ui/animated-button"

interface OnboardingLayoutProps {
  children: React.ReactNode
  showBackButton?: boolean
  showNextButton?: boolean
  showSkipButton?: boolean
  nextDisabled?: boolean
  nextLabel?: string
  onNext?: () => void
}

export function OnboardingLayout({
  children,
  showBackButton = true,
  showNextButton = true,
  showSkipButton = true,
  nextDisabled = false,
  nextLabel = "Next",
  onNext,
}: OnboardingLayoutProps) {
  const { currentStep, totalSteps, nextStep, prevStep, skipOnboarding, userPreferences } = useOnboarding()
  const [progress, setProgress] = useState(0)
  const [showSkipDialog, setShowSkipDialog] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const shouldReduceMotion = prefersReducedMotion || userPreferences.accessibilityPreferences.reducedMotion
  const shouldEnableAnimations = userPreferences.animationPreferences.enableAnimations

  // Calculate progress percentage
  useEffect(() => {
    // Start with 0 progress
    setProgress(0)

    // Animate progress bar
    const timer = setTimeout(
      () => {
        const percentage = ((currentStep - 1) / totalSteps) * 100
        setProgress(percentage)
      },
      shouldReduceMotion ? 50 : 300,
    )

    return () => clearTimeout(timer)
  }, [currentStep, totalSteps, shouldReduceMotion])

  const handleNext = () => {
    if (onNext) {
      onNext()
    } else {
      nextStep()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with progress */}
      <motion.header
        className="border-b p-4 sticky top-0 bg-background z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: shouldReduceMotion ? 0.2 : 0.5 }}
      >
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">Wellness Dashboard</h1>
          {showSkipButton && (
            <Button variant="ghost" onClick={() => setShowSkipDialog(true)} aria-label="Skip onboarding">
              Skip
            </Button>
          )}
        </div>
        <div className="container mx-auto mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>
              Step {currentStep} of {totalSteps}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: `${((currentStep - 2) / totalSteps) * 100}%` }}
              animate={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
              transition={{
                duration: shouldReduceMotion ? 0.3 : 0.8,
                ease: "easeOut",
              }}
              aria-label={`Onboarding progress: ${Math.round(progress)}%`}
            />
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="flex-1"
            initial={shouldEnableAnimations && !shouldReduceMotion ? "hidden" : false}
            animate={shouldEnableAnimations && !shouldReduceMotion ? "visible" : false}
            exit={shouldEnableAnimations && !shouldReduceMotion ? "exit" : false}
            variants={fadeIn}
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <motion.div
          className="mt-8 flex justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: shouldReduceMotion ? 0.1 : 0.5 }}
        >
          {showBackButton && currentStep > 1 ? (
            <AnimatedButton
              onClick={prevStep}
              variant="outline"
              className="flex items-center gap-2"
              aria-label="Go back to previous step"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </AnimatedButton>
          ) : (
            <div></div>
          )}

          {showNextButton && (
            <AnimatedButton
              onClick={handleNext}
              disabled={nextDisabled}
              className="flex items-center gap-2"
              aria-label={nextLabel}
            >
              {nextLabel}
              {nextLabel.toLowerCase() === "next" && <ArrowRight className="h-4 w-4" />}
            </AnimatedButton>
          )}
        </motion.div>
      </main>

      {/* Skip confirmation dialog */}
      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip Onboarding?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to skip the onboarding process? You can always access this information later from
              the help section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={skipOnboarding}>Skip Onboarding</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
