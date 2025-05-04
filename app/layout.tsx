import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { EnhancedThemeProvider, ThemeToggle } from "@/components/enhanced-theme-provider"
import { IconProvider } from "@/context/icon-context"
import { ScreenReaderAnnouncerProvider } from "@/components/accessibility/screen-reader-announcer"
import { StatusAnnouncerProvider } from "@/components/accessibility/status-announcer"
import { SkipLink } from "@/components/accessibility/skip-link"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context-fixed"
import { ProfileProvider } from "@/context/profile-context"
import { AuthErrorBoundary } from "@/components/auth/auth-error-boundary"

// Import the environment validation utility and error component
import { validateSupabaseEnv } from "@/lib/env"
import { EnvError } from "@/components/env-error"

// Add this import at the top
import { ensureProfilesTable } from "@/utils/db-utils"

// Add this function before the RootLayout component
export async function generateMetadata() {
  // This is a good place to run initialization code
  // as it's executed server-side before the layout renders
  try {
    await ensureProfilesTable()
  } catch (error) {
    console.error("Error initializing database:", error)
  }

  return {
    title: "Wellness Dashboard",
    description: "Track and manage your wellness metrics",
  }
}

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Check for missing environment variables
  const isSuperbaseConfigured = validateSupabaseEnv()
  const missingVars = []

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missingVars.push("NEXT_PUBLIC_SUPABASE_URL")
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

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
                        <div className="fixed top-4 right-4 z-50">
                          <ThemeToggle />
                        </div>
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

export const metadata = {
      generator: 'v0.dev'
    };
