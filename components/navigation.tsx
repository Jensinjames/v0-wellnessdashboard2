"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"

export function Navigation() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <nav className="border-b bg-background" aria-label="Main Navigation">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold" aria-label="Wellness Dashboard Home">
            Wellness Dashboard
          </Link>
          <div className="flex gap-4" role="menubar" aria-label="Main Menu">
            <Link
              href="/dashboard"
              className={`text-sm ${pathname === "/dashboard" ? "font-medium text-primary" : "text-muted-foreground"}`}
              role="menuitem"
              aria-current={pathname === "/dashboard" ? "page" : undefined}
            >
              Dashboard
            </Link>
            <Link
              href="/goals"
              className={`text-sm ${pathname === "/goals" ? "font-medium text-primary" : "text-muted-foreground"}`}
              role="menuitem"
              aria-current={pathname === "/goals" ? "page" : undefined}
            >
              Goals
            </Link>
            <Link
              href="/categories"
              className={`text-sm ${pathname === "/categories" ? "font-medium text-primary" : "text-muted-foreground"}`}
              role="menuitem"
              aria-current={pathname === "/categories" ? "page" : undefined}
            >
              Categories
            </Link>
            <Link
              href="/profile"
              className={`text-sm ${pathname === "/profile" ? "font-medium text-primary" : "text-muted-foreground"}`}
              role="menuitem"
              aria-current={pathname === "/profile" ? "page" : undefined}
            >
              Profile
            </Link>
          </div>
        </div>
        <Button variant="ghost" onClick={() => signOut()} aria-label="Sign Out">
          Sign Out
        </Button>
      </div>
    </nav>
  )
}
