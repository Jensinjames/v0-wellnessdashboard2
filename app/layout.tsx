import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { ProfileCompletionProvider } from "@/context/profile-completion-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Wellness Dashboard",
  description: "Track and manage your wellness activities",
  applicationName: "Wellness Dashboard",
  authors: [{ name: "Wellness Dashboard Team" }],
  viewport: "width=device-width, initial-scale=1",
  colorScheme: "light dark",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <ProfileCompletionProvider>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black"
              >
                Skip to main content
              </a>
              {children}
            </ProfileCompletionProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
