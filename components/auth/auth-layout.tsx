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
}

export function AuthLayout({ children, redirectIfAuthenticated = true, redirectPath = "/dashboard" }: AuthLayoutProps) {
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
    return <AuthFormLoading />
  }

  // If user is authenticated and we're redirecting, don't render children
  if (user && redirectIfAuthenticated) {
    return <AuthFormLoading />
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <div className="grid w-full max-w-[1200px] grid-cols-1 overflow-hidden rounded-xl border border-border shadow-sm md:grid-cols-2">
        <div className="hidden bg-muted p-10 md:block">
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
          <Card className="w-full max-w-md mx-auto">{children}</Card>
        </div>
      </div>
    </div>
  )
}

export function AuthFormLoading() {
  return (
    <div className="container flex h-screen items-center justify-center">
      <div className="grid w-full max-w-[1200px] grid-cols-1 overflow-hidden rounded-xl border border-border shadow-sm md:grid-cols-2">
        <div className="hidden bg-muted p-10 md:block">
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
          <Card className="w-full max-w-md mx-auto">
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
