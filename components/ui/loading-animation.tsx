"use client"

import { motion } from "framer-motion"
import { useReducedMotion } from "@/utils/animation-utils"

interface LoadingAnimationProps {
  size?: "sm" | "md" | "lg"
  color?: string
  className?: string
}

export function LoadingAnimation({ size = "md", color = "currentColor", className = "" }: LoadingAnimationProps) {
  const prefersReducedMotion = useReducedMotion()

  // Size mappings
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  // If reduced motion is preferred, show a simple loading indicator
  if (prefersReducedMotion) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className={`${sizeMap[size]} border-2 border-t-transparent border-current rounded-full animate-spin`} />
      </div>
    )
  }

  // Otherwise, show a more elaborate loading animation
  const containerSize = size === "sm" ? 16 : size === "md" ? 32 : 48
  const circleSize = containerSize / 8

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeMap[size]} relative`}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <motion.span
            key={index}
            className="absolute rounded-full"
            style={{
              width: circleSize,
              height: circleSize,
              x: -circleSize / 2,
              y: -circleSize / 2,
              backgroundColor: color,
              top: "50%",
              left: "50%",
              transformOrigin: `${containerSize / 2}px ${containerSize / 2}px`,
              transform: `rotate(${index * 60}deg) translate(${containerSize / 2}px, 0)`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              delay: index * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  )
}
