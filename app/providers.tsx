"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { WellnessProvider } from "@/context/wellness-context-optimistic"
import { LoadingProvider } from "@/context/loading-context"
import { SettingsProvider } from "@/context/settings-context"
import { OptimisticUpdatesProvider } from "@/context/optimistic-updates-context"
import { GlobalErrorInitializer } from "@/components/global-error-initializer"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <OptimisticUpdatesProvider>
        <LoadingProvider>
          <SettingsProvider>
            <WellnessProvider>
              <GlobalErrorInitializer />
              {children}
            </WellnessProvider>
          </SettingsProvider>
        </LoadingProvider>
      </OptimisticUpdatesProvider>
    </ThemeProvider>
  )
}
