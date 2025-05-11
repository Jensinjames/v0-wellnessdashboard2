"use client"

import type { ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useReducedMotion } from "@/utils/animation-utils"

interface AnimatedTransitionProps {
  children: ReactNode
  isVisible?: boolean
  motionKey?: string | number
  variants?: any
  className?: string
}

export function AnimatedTransition({
  children,
  isVisible = true,
  motionKey,
  variants,
  className,
}: AnimatedTransitionProps) {
  const prefersReducedMotion = useReducedMotion()

  // Default variants if none provided
  const defaultVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.4,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.2,
      },
    },
  }

  const selectedVariants = prefersReducedMotion ? defaultVariants : variants || defaultVariants

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={motionKey}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={selectedVariants}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
