"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { HeartbeatProvider } from "@/components/providers/heartbeat-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <HeartbeatProvider>
        <AuthProvider>{children}</AuthProvider>
      </HeartbeatProvider>
    </ThemeProvider>
  )
}
