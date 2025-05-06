"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "@/utils/animation-utils"
import { useOnboarding } from "@/context/onboarding-context"

interface ConfettiProps {
  duration?: number
}

export function Confetti({ duration = 3000 }: ConfettiProps) {
  const [isActive, setIsActive] = useState(true)
  const prefersReducedMotion = useReducedMotion()
  const { userPreferences } = useOnboarding()
  const shouldReduceMotion = prefersReducedMotion || userPreferences?.accessibilityPreferences?.reducedMotion
  const shouldEnableAnimations = userPreferences?.animationPreferences?.enableAnimations

  // Only show confetti if animations are enabled and reduced motion is not preferred
  const showConfetti = shouldEnableAnimations && !shouldReduceMotion

  useEffect(() => {
    if (!showConfetti) return

    // Hide confetti after duration
    const timer = setTimeout(() => {
      setIsActive(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, showConfetti])

  if (!showConfetti || !isActive) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50" aria-hidden="true">
      {Array.from({ length: 100 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-5%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${Math.random() * 3 + 2}s`,
            backgroundColor: getRandomColor(),
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
          }}
        />
      ))}
    </div>
  )
}

function getRandomColor() {
  const colors = [
    "#FF5252", // Red
    "#FF4081", // Pink
    "#E040FB", // Purple
    "#7C4DFF", // Deep Purple
    "#536DFE", // Indigo
    "#448AFF", // Blue
    "#40C4FF", // Light Blue
    "#18FFFF", // Cyan
    "#64FFDA", // Teal
    "#69F0AE", // Green
    "#B2FF59", // Light Green
    "#EEFF41", // Lime
    "#FFFF00", // Yellow
    "#FFD740", // Amber
    "#FFAB40", // Orange
    "#FF6E40", // Deep Orange
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
