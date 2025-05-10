"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { HeartbeatProvider } from "@/components/providers/heartbeat-provider"
import { SupabaseProvider } from "@/components/providers/supabase-provider"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SupabaseProvider>
        <AuthProvider>
          <HeartbeatProvider>
            {children}
            <Toaster />
          </HeartbeatProvider>
        </AuthProvider>
      </SupabaseProvider>
    </ThemeProvider>
  )
}
