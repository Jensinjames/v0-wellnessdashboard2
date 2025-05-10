"use client"

import type React from "react"

import { useState } from "react"
import { useOnboarding } from "@/context/onboarding-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/utils/animation-utils"

export function WelcomeStep() {
  const { userPreferences, updatePreferences } = useOnboarding()
  const [name, setName] = useState(userPreferences.name)
  const prefersReducedMotion = useReducedMotion()
  const shouldReduceMotion = prefersReducedMotion || userPreferences.accessibilityPreferences.reducedMotion
  const shouldEnableAnimations = userPreferences.animationPreferences.enableAnimations

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    updatePreferences({ name: e.target.value })
  }

  // Only use animations if they're enabled and reduced motion is not preferred
  const useAnimations = shouldEnableAnimations && !shouldReduceMotion

  return (
    <motion.div
      className="flex flex-col items-center justify-center max-w-2xl mx-auto py-8"
      initial={useAnimations ? { opacity: 0 } : { opacity: 1 }}
      animate={useAnimations ? { opacity: 1 } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-center mb-8"
        initial={useAnimations ? { y: 20, opacity: 0 } : {}}
        animate={useAnimations ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to Your Wellness Journey</h1>
        <p className="text-muted-foreground">
          Let's personalize your experience to help you achieve your wellness goals.
        </p>
      </motion.div>

      <motion.div
        initial={useAnimations ? { scale: 0.95, opacity: 0 } : {}}
        animate={useAnimations ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full"
      >
        <Card>
          <CardHeader>
            <CardTitle>Let's get to know you</CardTitle>
            <CardDescription>
              We'll use this information to personalize your dashboard and recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <motion.div
                className="space-y-2"
                initial={useAnimations ? { y: 10, opacity: 0 } : {}}
                animate={useAnimations ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Label htmlFor="name">What should we call you?</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={handleNameChange}
                  autoComplete="name"
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
                />
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        className="mt-8 text-center text-muted-foreground"
        initial={useAnimations ? { opacity: 0 } : {}}
        animate={useAnimations ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <p>This will only take a few minutes to complete.</p>
      </motion.div>
    </motion.div>
  )
}
