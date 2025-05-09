import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Providers } from "@/components/providers"

// Import the initialization utility
import "@/lib/init-supabase"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Wellness Dashboard",
  description: "Track and manage your wellness goals",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
