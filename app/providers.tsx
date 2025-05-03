"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SupabaseAuthProvider } from "@/components/providers/supabase-auth-provider"
import { OptimisticUpdatesProvider } from "@/context/optimistic-updates-context"
import { WellnessProvider } from "@/context/wellness-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SupabaseAuthProvider>
        <OptimisticUpdatesProvider>
          <WellnessProvider>
            {children}
            <Toaster />
          </WellnessProvider>
        </OptimisticUpdatesProvider>
      </SupabaseAuthProvider>
    </ThemeProvider>
  )
}
