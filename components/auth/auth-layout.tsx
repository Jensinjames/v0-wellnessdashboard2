"use client"

import type React from "react"
import { Card } from "@/components/ui/card"

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
}

export function AuthLayout({ children, title = "Authentication" }: AuthLayoutProps) {
  return (
    <div className="container flex h-screen items-center justify-center" aria-labelledby="auth-layout-title">
      <div className="grid w-full max-w-[1200px] grid-cols-1 overflow-hidden rounded-xl border border-border shadow-sm md:grid-cols-2">
        <div className="hidden bg-muted p-10 md:block" aria-hidden="true">
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <div className="h-6 w-6 rounded-full bg-primary" aria-hidden="true" />
              <span>Wellness Dashboard</span>
            </div>
            <div className="space-y-4">
              <div className="text-2xl font-bold">Track your wellness journey with ease</div>
              <div className="text-muted-foreground">
                Monitor your activities, set goals, and visualize your progress all in one place.
              </div>
            </div>
            <div
              className="h-[300px] rounded-lg bg-gradient-to-br from-primary/20 to-primary/5"
              aria-hidden="true"
              role="presentation"
            />
          </div>
        </div>
        <div className="p-6 md:p-10">
          <h1 id="auth-layout-title" className="sr-only">
            {title}
          </h1>
          <Card className="w-full max-w-md mx-auto">{children}</Card>
        </div>
      </div>
    </div>
  )
}

export function AuthFormLoading({ title = "Authentication" }: { title?: string }) {
  return (
    <div className="container flex h-screen items-center justify-center" aria-live="polite" aria-busy="true">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">{title}</h1>
        <p>Loading authentication form...</p>
      </div>
    </div>
  )
}
