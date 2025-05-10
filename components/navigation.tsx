"use client"

import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function Navigation() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold">
              Wellness Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold">
            Wellness Dashboard
          </Link>
          {user && (
            <nav className="hidden md:flex gap-4">
              <Link
                href="/dashboard"
                className={`text-sm ${isActive("/dashboard") ? "font-medium text-primary" : "text-muted-foreground"}`}
              >
                Dashboard
              </Link>
              <Link
                href="/goals"
                className={`text-sm ${isActive("/goals") ? "font-medium text-primary" : "text-muted-foreground"}`}
              >
                Goals
              </Link>
              <Link
                href="/categories"
                className={`text-sm ${isActive("/categories") ? "font-medium text-primary" : "text-muted-foreground"}`}
              >
                Categories
              </Link>
              <Link
                href="/profile"
                className={`text-sm ${isActive("/profile") ? "font-medium text-primary" : "text-muted-foreground"}`}
              >
                Profile
              </Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
