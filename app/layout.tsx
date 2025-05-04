import type React from "react"
import "@/styles/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProviderWrapper } from "@/components/auth/auth-provider-wrapper"
import { ProfileProvider } from "@/context/profile-context"
import { ScreenReaderAnnouncerProvider } from "@/components/accessibility/screen-reader-announcer"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Wellness Dashboard",
  description: "Track and visualize your wellness journey",
  viewport: "width=device-width, initial-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
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
        {/* Theme provider must be the outermost provider */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {/* Use the wrapper instead of directly using AuthProvider */}
          <AuthProviderWrapper>
            {/* Profile provider depends on auth context */}
            <ProfileProvider>
              {/* Screen reader announcer for accessibility */}
              <ScreenReaderAnnouncerProvider>
                {children}
                {/* Toast notifications */}
                <Toaster />
              </ScreenReaderAnnouncerProvider>
            </ProfileProvider>
          </AuthProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
