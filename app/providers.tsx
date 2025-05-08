"use client"

import type React from "react"

import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { ToastProvider } from "@/components/ui/toast"
import { initializeSupabase } from "@/lib/supabase-manager"
import { startAuthMonitoring } from "@/utils/auth-monitor"

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize Supabase on app startup
  useEffect(() => {
    // Initialize Supabase
    initializeSupabase()

    // Start auth monitoring in development
    if (process.env.NODE_ENV === "development") {
      return startAuthMonitoring()
    }
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
