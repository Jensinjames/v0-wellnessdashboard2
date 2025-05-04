import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { EnhancedThemeProvider } from "@/components/enhanced-theme-provider"
import { IconProvider } from "@/context/icon-context"
import { ScreenReaderAnnouncerProvider } from "@/components/accessibility/screen-reader-announcer"
import { StatusAnnouncerProvider } from "@/components/accessibility/status-announcer"
import { SkipLink } from "@/components/accessibility/skip-link"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context"
import { ProfileProvider } from "@/context/profile-context"
import { AuthErrorBoundary } from "@/components/auth/auth-error-boundary"
import { checkRequiredEnvVars } from "@/lib/env"
import { EnvError } from "@/components/env-error"
import "@/app/globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

// Check for required environment variables
const missingVars = checkRequiredEnvVars([
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
])

export const metadata = {
  title: "Wellness Dashboard",
  description: "Track and manage your wellness activities",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {missingVars.length > 0 && <EnvError missingVars={missingVars} />}
          <EnhancedThemeProvider>
            <IconProvider>
              <AuthProvider>
                <ProfileProvider>
                  <StatusAnnouncerProvider>
                    <ScreenReaderAnnouncerProvider>
                      <AuthErrorBoundary>
                        <SkipLink />
                        <main id="main-content" className="min-h-screen bg-white dark:bg-slate-950">
                          {children}
                        </main>
                        <Toaster />
                      </AuthErrorBoundary>
                    </ScreenReaderAnnouncerProvider>
                  </StatusAnnouncerProvider>
                </ProfileProvider>
              </AuthProvider>
            </IconProvider>
          </EnhancedThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
