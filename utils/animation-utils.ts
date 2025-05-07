"use client"

import { useEffect, useState } from "react"

// Check if the user prefers reduced motion
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check for system preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleChange)

    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return prefersReducedMotion
}

// Animation duration based on preferences
export function getAnimationDuration(
  baseMs: number,
  reducedMotion: boolean,
  userPreferencesReducedMotion?: boolean,
): string {
  // If either system or user preferences indicate reduced motion, use shorter duration
  if (reducedMotion || userPreferencesReducedMotion) {
    return `${baseMs * 0.5}ms`
  }
  return `${baseMs}ms`
}

// Animation variants for Framer Motion
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
}

export const slideIn = (direction: "left" | "right" = "right") => ({
  hidden: { opacity: 0, x: direction === "left" ? -20 : 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, x: direction === "left" ? 20 : -20, transition: { duration: 0.2 } },
})

export const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export const pulse = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" },
  },
}
