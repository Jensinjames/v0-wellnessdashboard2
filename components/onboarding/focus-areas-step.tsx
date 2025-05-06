"use client"

import { useOnboarding } from "@/context/onboarding-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { useReducedMotion, staggerChildren, staggerItem } from "@/utils/animation-utils"

const FOCUS_AREAS = [
  { id: "faith", label: "Faith & Spirituality", description: "Prayer, meditation, scripture study" },
  { id: "life", label: "Life & Relationships", description: "Family time, social activities, hobbies" },
  { id: "work", label: "Work & Career", description: "Professional development, productivity, work-life balance" },
  { id: "health", label: "Health & Fitness", description: "Exercise, nutrition, sleep, mental wellbeing" },
  { id: "learning", label: "Learning & Growth", description: "Education, skill development, personal growth" },
  { id: "finance", label: "Financial Wellness", description: "Budgeting, saving, financial planning" },
]

export function FocusAreasStep() {
  const { userPreferences, updatePreferences } = useOnboarding()
  const prefersReducedMotion = useReducedMotion()
  const shouldReduceMotion = prefersReducedMotion || userPreferences.accessibilityPreferences.reducedMotion
  const shouldEnableAnimations = userPreferences.animationPreferences.enableAnimations

  const toggleFocusArea = (area: string) => {
    const currentAreas = [...userPreferences.focusAreas]

    if (currentAreas.includes(area)) {
      updatePreferences({
        focusAreas: currentAreas.filter((a) => a !== area),
      })
    } else {
      updatePreferences({
        focusAreas: [...currentAreas, area],
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Choose Your Focus Areas</h1>
        <p className="text-muted-foreground">Select the areas of wellness you want to track and improve.</p>
      </motion.div>

      <motion.div
        initial={useAnimations ? { scale: 0.95, opacity: 0 } : {}}
        animate={useAnimations ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>What areas would you like to focus on?</CardTitle>
            <CardDescription>
              Select the categories that are most important to you. We recommend starting with 3-4 areas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={useAnimations ? staggerChildren : {}}
              initial={useAnimations ? "hidden" : false}
              animate={useAnimations ? "visible" : false}
            >
              {FOCUS_AREAS.map((area, index) => (
                <motion.div
                  key={area.id}
                  variants={useAnimations ? staggerItem : {}}
                  custom={index}
                  whileHover={useAnimations ? { scale: 1.02 } : {}}
                  whileTap={useAnimations ? { scale: 0.98 } : {}}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                    userPreferences.focusAreas.includes(area.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => toggleFocusArea(area.id)}
                  role="checkbox"
                  aria-checked={userPreferences.focusAreas.includes(area.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      toggleFocusArea(area.id)
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{area.label}</h3>
                    {userPreferences.focusAreas.includes(area.id) && (
                      <motion.div
                        initial={useAnimations ? { scale: 0, opacity: 0 } : {}}
                        animate={useAnimations ? { scale: 1, opacity: 1 } : {}}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <Badge variant="outline" className="bg-primary text-primary-foreground">
                          Selected
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{area.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
