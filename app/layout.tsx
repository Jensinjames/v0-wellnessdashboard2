import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { EnhancedThemeProvider } from "@/components/enhanced-theme-provider"
import { IconProvider } from "@/context/icon-context"
import { ScreenReaderAnnouncerProvider } from "@/components/accessibility/screen-reader-announcer"
import { StatusAnnouncerProvider } from "@/components/accessibility/status-announcer"
import { SkipLink } from "@/components/accessibility/skip-link"
import { Toaster } from "@/components/ui/toaster"
import { NavigationHeader } from "@/components/navigation-header"
import { WellnessProvider } from "@/context/wellness-context"
import { TrackingProvider } from "@/context/tracking-context"
import { AuthProvider } from "@/providers/auth-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Wellness Dashboard",
  description: "Track and manage your wellness activities",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <EnhancedThemeProvider>
            <IconProvider>
              <StatusAnnouncerProvider>
                <ScreenReaderAnnouncerProvider>
                  <WellnessProvider>
                    <TrackingProvider>
                      <AuthProvider>
                        <SkipLink />
                        <NavigationHeader />
                        <main id="main-content" className="min-h-[calc(100vh-3.5rem)] bg-white dark:bg-slate-950 pt-4">
                          {children}
                        </main>
                        <Toaster />
                      </AuthProvider>
                    </TrackingProvider>
                  </WellnessProvider>
                </ScreenReaderAnnouncerProvider>
              </StatusAnnouncerProvider>
            </IconProvider>
          </EnhancedThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
