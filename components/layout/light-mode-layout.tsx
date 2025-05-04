"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"
import { useEffect } from "react"

interface LightModeLayoutProps {
  children: React.ReactNode
  className?: string
}

export function LightModeLayout({ children, className }: LightModeLayoutProps) {
  const { setTheme } = useTheme()

  // Ensure light mode is set as default
  useEffect(() => {
    setTheme("light")
  }, [setTheme])

  return (
    <div className={cn("min-h-screen bg-white text-slate-900", "transition-colors duration-200", className)}>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {children}
    </div>
  )
}
