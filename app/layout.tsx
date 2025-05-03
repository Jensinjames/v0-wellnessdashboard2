import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { SettingsProvider } from "@/context/settings-context"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { MobileNav } from "@/components/mobile-nav"

export const metadata: Metadata = {
  title: "Wellness Dashboard",
  description: "Track and improve your wellness metrics",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <SettingsProvider>
            <div className="flex min-h-screen flex-col md:flex-row">
              <DashboardSidebar />
              <main className="flex-1 dashboard-component">{children}</main>
              <MobileNav />
            </div>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
