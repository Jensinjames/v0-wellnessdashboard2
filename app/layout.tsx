import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/auth-context"
import { ProfileCompletionProvider } from "@/context/profile-completion-context"
import { EnvProvider } from "@/components/providers/env-provider"
import { NavigationProvider } from "@/context/navigation-context"
import { SupabaseProvider } from "@/components/providers/supabase-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Wellness Dashboard",
  description: "Track and manage your wellness goals",
    generator: 'v0.dev'
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
          <SupabaseProvider>
            <AuthProvider>
              <ProfileCompletionProvider>
                <NavigationProvider>{children}</NavigationProvider>
              </ProfileCompletionProvider>
            </AuthProvider>
          </SupabaseProvider>
        </EnvProvider>
      </body>
    </html>
  )
}
