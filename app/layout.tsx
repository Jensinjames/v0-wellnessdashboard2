import type React from "react"
import "@/styles/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { ScreenReaderAnnouncerProvider } from "@/components/accessibility/screen-reader-announcer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Wellness Dashboard",
  description: "Track and visualize your wellness journey",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Wellness Dashboard</title>
        <meta name="description" content="Track and visualize your wellness journey" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <ScreenReaderAnnouncerProvider>{children}</ScreenReaderAnnouncerProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
