"use client"

import Link from "next/link"
import { Home, User, BarChart2, Settings } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { MobileNav } from "./mobile-nav"

export function DashboardHeader() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <MobileNav />
            <Link href="/dashboard" className="text-xl font-bold hidden md:block">
              Wellness Dashboard
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Link>
            <Link
              href="/goals"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <BarChart2 className="h-4 w-4" />
              <span>Goals</span>
            </Link>
            <Link
              href="/categories"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              <span>Categories</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  )
}
