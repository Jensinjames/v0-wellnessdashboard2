"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { HeartbeatProvider } from "@/components/providers/heartbeat-provider"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <HeartbeatProvider>
          {children}
          <Toaster />
        </HeartbeatProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
