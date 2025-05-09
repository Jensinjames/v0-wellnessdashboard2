import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/auth-context"
import { ProfileCompletionProvider } from "@/context/profile-completion-context"
import { EnvProvider } from "@/components/providers/env-provider"
import { NavigationProvider } from "@/context/navigation-context"
import { SupabaseErrorProvider } from "@/context/supabase-error-context"
import { GlobalErrorIndicator } from "@/components/error-boundary/global-error-indicator"

// Import the initialization utility
import "@/lib/init-supabase"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Wellness Dashboard",
  description: "Track and manage your wellness goals",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <EnvProvider>
          <AuthProvider>
            <SupabaseErrorProvider>
              <ProfileCompletionProvider>
                <NavigationProvider>
                  {children}
                  <GlobalErrorIndicator />
                </NavigationProvider>
              </ProfileCompletionProvider>
            </SupabaseErrorProvider>
          </AuthProvider>
        </EnvProvider>
      </body>
    </html>
  )
}
