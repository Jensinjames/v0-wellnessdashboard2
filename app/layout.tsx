import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { Navigation } from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Wellness Dashboard",
  description: "Track and manage your wellness activities",
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <div className="flex min-h-screen">
              <aside className="hidden w-64 border-r bg-background md:block">
                <div className="flex h-16 items-center border-b px-6">
                  <h1 className="text-lg font-semibold">Wellness Tracker</h1>
                </div>
                <Navigation />
              </aside>
              <main className="flex-1 overflow-auto">
                <div className="flex h-16 items-center border-b px-6">
                  <h2 className="text-lg font-semibold md:hidden">Wellness Tracker</h2>
                </div>
                {children}
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
