"use client"

import type React from "react"

import { type ButtonHTMLAttributes, forwardRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useReducedMotion } from "@/utils/animation-utils"
import { useOnboarding } from "@/context/onboarding-context"

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  children: React.ReactNode
  className?: string
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ variant = "default", size = "default", children, className, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion()
    const { userPreferences } = useOnboarding()
    const shouldReduceMotion = prefersReducedMotion || userPreferences?.accessibilityPreferences?.reducedMotion
    const shouldEnableAnimations = userPreferences?.animationPreferences?.enableAnimations

    // Only use animations if they're enabled and reduced motion is not preferred
    const useAnimations = shouldEnableAnimations && !shouldReduceMotion

    return (
      <motion.div
        whileHover={useAnimations ? { scale: 1.02 } : {}}
        whileTap={useAnimations ? { scale: 0.98 } : {}}
        transition={{ duration: 0.2 }}
      >
        <Button ref={ref} variant={variant} size={size} className={className} {...props}>
          {children}
        </Button>
      </motion.div>
    )
  },
)

AnimatedButton.displayName = "AnimatedButton"
