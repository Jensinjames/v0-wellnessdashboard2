import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { EnhancedThemeProvider, ThemeToggle } from "@/components/enhanced-theme-provider"
import { IconProvider } from "@/context/icon-context"
import { ScreenReaderAnnouncerProvider } from "@/components/accessibility/screen-reader-announcer"
import { StatusAnnouncerProvider } from "@/components/accessibility/status-announcer"
import { SkipLink } from "@/components/accessibility/skip-link"
import { Toaster } from "@/components/ui/toaster"

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
                  <SkipLink />
                  <div className="fixed top-4 right-4 z-50">
                    <ThemeToggle />
                  </div>
                  <main id="main-content" className="min-h-screen bg-white dark:bg-slate-950">
                    {children}
                  </main>
                  <Toaster />
                </ScreenReaderAnnouncerProvider>
              </StatusAnnouncerProvider>
            </IconProvider>
          </EnhancedThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
