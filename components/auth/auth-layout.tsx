"use client"

import type React from "react"

import { Card } from "@/components/ui/card"

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
}

export function AuthLayout({ children, title = "Authentication" }: AuthLayoutProps) {
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

export function AuthFormLoading({ title = "Authentication" }: { title?: string }) {
  return (
    <div className="container flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">{title}</h1>
        <p>Loading authentication form...</p>
      </div>
    </div>
  )
}
