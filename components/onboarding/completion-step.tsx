"use client"

import { useOnboarding } from "@/context/onboarding-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { Confetti } from "@/components/ui/confetti"

import { motion } from "framer-motion"
import { useReducedMotion, pulse, staggerChildren, staggerItem } from "@/utils/animation-utils"

export function CompletionStep() {
  const { userPreferences } = useOnboarding()
  const prefersReducedMotion = useReducedMotion()
  const shouldReduceMotion = prefersReducedMotion || userPreferences.accessibilityPreferences.reducedMotion
  const shouldEnableAnimations = userPreferences.animationPreferences.enableAnimations

  // Get first name for personalized message
  const firstName = userPreferences.name.split(" ")[0] || "there"

  // Only use animations if they're enabled and reduced motion is not preferred
  const useAnimations = shouldEnableAnimations && !shouldReduceMotion

  return (
    <motion.div
      className="max-w-2xl mx-auto py-4 text-center"
      initial={useAnimations ? { opacity: 0 } : { opacity: 1 }}
      animate={useAnimations ? { opacity: 1 } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {useAnimations && <Confetti duration={5000} />}

      <motion.div
        className="flex justify-center mb-8"
        initial={useAnimations ? { scale: 0, opacity: 0 } : {}}
        animate={useAnimations ? { scale: 1, opacity: 1 } : {}}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 10,
          delay: 0.2,
        }}
      >
        <motion.div
          className="rounded-full bg-primary/10 p-4"
          variants={useAnimations ? pulse : {}}
          initial="initial"
          animate="animate"
        >
          <CheckCircle2 className="h-12 w-12 text-primary" />
        </motion.div>
      </motion.div>

      <motion.div
        className="mb-8"
        initial={useAnimations ? { y: 20, opacity: 0 } : {}}
        animate={useAnimations ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">You're All Set, {firstName}!</h1>
        <p className="text-muted-foreground">
          Your wellness dashboard is ready to help you track and improve your wellbeing.
        </p>
      </motion.div>

      <motion.div
        initial={useAnimations ? { scale: 0.95, opacity: 0 } : {}}
        animate={useAnimations ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Your Personalized Dashboard</CardTitle>
            <CardDescription>Here's what we've set up for you based on your preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              className="space-y-6"
              variants={useAnimations ? staggerChildren : {}}
              initial={useAnimations ? "hidden" : false}
              animate={useAnimations ? "visible" : false}
            >
              {userPreferences.focusAreas.length > 0 && (
                <motion.div variants={useAnimations ? staggerItem : {}}>
                  <h3 className="font-medium mb-2">Focus Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {userPreferences.focusAreas.map((area, index) => (
                      <motion.div
                        key={area}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        initial={useAnimations ? { opacity: 0, scale: 0.8 } : {}}
                        animate={useAnimations ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.8 + index * 0.1 }}
                      >
                        {area.charAt(0).toUpperCase() + area.slice(1)}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {userPreferences.wellnessGoals.length > 0 && (
                <motion.div variants={useAnimations ? staggerItem : {}}>
                  <h3 className="font-medium mb-2">Wellness Goals</h3>
                  <ul className="list-disc list-inside text-left space-y-1">
                    {userPreferences.wellnessGoals.map((goal, index) => (
                      <motion.li
                        key={goal}
                        initial={useAnimations ? { opacity: 0, x: -10 } : {}}
                        animate={useAnimations ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 1 + index * 0.1 }}
                      >
                        {goal
                          .split("-")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {userPreferences.reminderTime && (
                <motion.div
                  variants={useAnimations ? staggerItem : {}}
                  initial={useAnimations ? { opacity: 0, y: 10 } : {}}
                  animate={useAnimations ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 1.2 }}
                >
                  <h3 className="font-medium mb-2">Daily Reminder</h3>
                  <p>
                    {userPreferences.reminderTime === "morning" && "Every morning at 8:00 AM"}
                    {userPreferences.reminderTime === "afternoon" && "Every afternoon at 2:00 PM"}
                    {userPreferences.reminderTime === "evening" && "Every evening at 8:00 PM"}
                  </p>
                </motion.div>
              )}

              <motion.div
                className="pt-4 text-center"
                initial={useAnimations ? { opacity: 0 } : {}}
                animate={useAnimations ? { opacity: 1 } : {}}
                transition={{ delay: 1.4 }}
              >
                <p className="text-muted-foreground">
                  You can always adjust these settings in your profile preferences.
                </p>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
