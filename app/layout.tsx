import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ScreenReaderAnnouncerProvider } from "@/components/accessibility/screen-reader-announcer"
import { SkipLink } from "@/components/accessibility/skip-link"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Wellness Dashboard",
  description: "Track and manage your wellness goals and activities",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ScreenReaderAnnouncerProvider>
            {/* Skip link for keyboard users */}
            <SkipLink href="#main-content">Skip to main content</SkipLink>

            <main id="main-content">{children}</main>

            <Toaster />
          </ScreenReaderAnnouncerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
