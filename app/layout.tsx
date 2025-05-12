import type React from "react"
import { NavigationHeader } from "@/components/navigation-header"
import { RealtimeConnectionIndicator } from "@/components/realtime-connection-indicator"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { WellnessProvider } from "@/context/wellness-context"
import { IconProvider } from "@/context/icon-context"
import { SkipLink } from "@/components/accessibility/skip-link"
import { ScreenReaderAnnouncerProvider } from "@/components/accessibility/screen-reader-announcer"
import "./globals.css"

export const metadata = {
  title: "Rollen Wellness Dashboard",
  description: "Track and manage your wellness activities",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light">
          <ScreenReaderAnnouncerProvider>
            <WellnessProvider>
              <IconProvider>
                <SkipLink />
                <div className="flex min-h-screen flex-col">
                  <NavigationHeader>
                    <div className="ml-auto flex items-center gap-4">
                      <RealtimeConnectionIndicator />
                    </div>
                  </NavigationHeader>
                  <main id="main-content" className="flex-1">
                    {children}
                  </main>
                </div>
                <Toaster />
              </IconProvider>
            </WellnessProvider>
          </ScreenReaderAnnouncerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
