import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SettingsProvider } from "@/context/settings-context"
import { LoadingProvider } from "@/context/loading-context"
import { GlobalErrorInitializer } from "@/components/global-error-initializer"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SettingsProvider>
            <LoadingProvider>
              <GlobalErrorInitializer />
              {children}
            </LoadingProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
