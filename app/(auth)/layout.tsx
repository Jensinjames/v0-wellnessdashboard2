import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication - Wellness Dashboard",
  description: "Authentication pages for Wellness Dashboard",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
