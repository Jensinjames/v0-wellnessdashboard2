import type React from "react"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context-improved"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import { ConfigurationError } from "@/components/config-error"
import { validateSupabaseConfig } from "@/lib/supabase-client-unified"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Wellness Dashboard",
  description: "Track and manage your wellness goals",
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  // Check if Supabase is configured correctly
  const isSupabaseConfigured = validateSupabaseConfig()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {/* Show configuration error if Supabase is not configured */}
          {!isSupabaseConfigured ? (
            <ConfigurationError />
          ) : (
            <AuthProvider>
              <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
              <Toaster />
            </AuthProvider>
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
