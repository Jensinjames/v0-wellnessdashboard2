import type React from "react"
import { AuthProvider } from "@/context/auth-context-fixed"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {/* Rest of your layout */}
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
