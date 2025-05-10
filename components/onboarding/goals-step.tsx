"use client"

import { useOnboarding } from "@/context/onboarding-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

import { motion } from "framer-motion"
import { useReducedMotion, staggerChildren, staggerItem } from "@/utils/animation-utils"

const WELLNESS_GOALS = [
  { id: "reduce-stress", label: "Reduce stress and anxiety" },
  { id: "improve-sleep", label: "Improve sleep quality" },
  { id: "increase-energy", label: "Increase energy levels" },
  { id: "build-habits", label: "Build healthy habits" },
  { id: "work-life-balance", label: "Achieve better work-life balance" },
  { id: "mindfulness", label: "Practice mindfulness" },
  { id: "physical-health", label: "Improve physical health" },
  { id: "mental-health", label: "Support mental wellbeing" },
]

export function GoalsStep() {
  const { userPreferences, updatePreferences } = useOnboarding()
  const prefersReducedMotion = useReducedMotion()
  const shouldReduceMotion = prefersReducedMotion || userPreferences.accessibilityPreferences.reducedMotion
  const shouldEnableAnimations = userPreferences.animationPreferences.enableAnimations

  const toggleGoal = (goal: string) => {
    const currentGoals = [...userPreferences.wellnessGoals]

    if (currentGoals.includes(goal)) {
      updatePreferences({
        wellnessGoals: currentGoals.filter((g) => g !== goal),
      })
    } else {
      updatePreferences({
        wellnessGoals: [...currentGoals, goal],
      })
    }
  }

  // Only use animations if they're enabled and reduced motion is not preferred
  const useAnimations = shouldEnableAnimations && !shouldReduceMotion

  return (
    <motion.div
      className="max-w-2xl mx-auto py-4"
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Set Your Wellness Goals</h1>
        <p className="text-muted-foreground">
          Select the goals that matter most to you. This helps us personalize your dashboard.
        </p>
      </motion.div>

      <motion.div
        initial={useAnimations ? { scale: 0.95, opacity: 0 } : {}}
        animate={useAnimations ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>What are your wellness goals?</CardTitle>
            <CardDescription>Select all that apply. You can always change these later.</CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={useAnimations ? staggerChildren : {}}
              initial={useAnimations ? "hidden" : false}
              animate={useAnimations ? "visible" : false}
            >
              {WELLNESS_GOALS.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  className="flex items-start space-x-3 space-y-0"
                  variants={useAnimations ? staggerItem : {}}
                  custom={index}
                  transition={{
                    delay: useAnimations ? 0.1 * index : 0,
                    duration: 0.3,
                  }}
                >
                  <Checkbox
                    id={goal.id}
                    checked={userPreferences.wellnessGoals.includes(goal.id)}
                    onCheckedChange={() => toggleGoal(goal.id)}
                    className="transition-all duration-300"
                  />
                  <Label
                    htmlFor={goal.id}
                    className="font-normal cursor-pointer transition-all duration-300 hover:text-primary"
                  >
                    {goal.label}
                  </Label>
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
