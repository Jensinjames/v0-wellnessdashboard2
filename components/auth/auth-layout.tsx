"use client"

import type React from "react"
import { Card } from "@/components/ui/card"

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  redirectIfAuthenticated?: boolean
}

export function AuthLayout({ children, title = "Authentication", redirectIfAuthenticated = true }: AuthLayoutProps) {
  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="w-full max-w-md mx-auto">
        <div className="p-6">
          <h1 className="text-xl font-semibold mb-4">{title}</h1>
          {children}
        </div>
      </Card>
    </div>
  )
}

export default AuthLayout
