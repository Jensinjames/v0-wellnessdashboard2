"use client"

import type React from "react"

import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { initAuthMonitor } from "@/utils/auth-monitor"

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize auth monitor
  useEffect(() => {
    const cleanup = initAuthMonitor()
    return cleanup
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  )
}
