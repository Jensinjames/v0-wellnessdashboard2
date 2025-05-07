import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/auth-context"
import { ProfileCompletionProvider } from "@/context/profile-completion-context"

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
        <AuthProvider>
          <ProfileCompletionProvider>{children}</ProfileCompletionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
