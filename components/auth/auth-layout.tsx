"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/auth-context"

interface AuthLayoutProps {
  children: React.ReactNode
  redirectIfAuthenticated?: boolean
  redirectPath?: string
  title?: string
}

export function AuthLayout({
  children,
  redirectIfAuthenticated = true,
  redirectPath = "/dashboard",
  title = "Authentication",
}: AuthLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Handle redirect for authenticated users
  useEffect(() => {
    if (!isLoading && user && redirectIfAuthenticated) {
      router.push(redirectPath)
    }
  }, [user, isLoading, redirectIfAuthenticated, redirectPath, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return <AuthFormLoading title={title} />
  }

  // If user is authenticated and we're redirecting, don't render children
  if (user && redirectIfAuthenticated) {
    return <AuthFormLoading title={title} />
  }

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
      <div className="grid w-full max-w-[1200px] grid-cols-1 overflow-hidden rounded-xl border border-border shadow-sm md:grid-cols-2">
        <div className="hidden bg-muted p-10 md:block" aria-hidden="true">
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <div className="h-6 w-6 rounded-full bg-primary" />
              <span>Wellness Dashboard</span>
            </div>
            <div className="space-y-4">
              <div className="text-2xl font-bold">Track your wellness journey with ease</div>
              <div className="text-muted-foreground">
                Monitor your activities, set goals, and visualize your progress all in one place.
              </div>
            </div>
            <div className="h-[300px] rounded-lg bg-gradient-to-br from-primary/20 to-primary/5" />
          </div>
        </div>
        <div className="p-6 md:p-10">
          <h1 className="sr-only">{title} - Loading</h1>
          <Card className="w-full max-w-md mx-auto">
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" aria-label="Loading title" />
                <Skeleton className="h-4 w-full" aria-label="Loading description" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4" aria-label="Loading field label" />
                  <Skeleton className="h-10 w-full" aria-label="Loading input field" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4" aria-label="Loading field label" />
                  <Skeleton className="h-10 w-full" aria-label="Loading input field" />
                </div>
                <Skeleton className="h-10 w-full" aria-label="Loading button" />
              </div>
              <Skeleton className="h-4 w-full" aria-label="Loading footer text" />
            </div>
          </Card>
          <div className="sr-only" aria-live="polite">
            Loading authentication form, please wait
          </div>
        </div>
      </div>
    </div>
  )
}
