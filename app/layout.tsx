import type React from "react"
import "@/styles/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { ProfileProvider } from "@/context/profile-context"
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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <ProfileProvider>
              <ScreenReaderAnnouncerProvider>{children}</ScreenReaderAnnouncerProvider>
            </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
