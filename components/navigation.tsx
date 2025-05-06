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
    <nav className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold">
            Wellness Dashboard
          </Link>
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className={`text-sm ${pathname === "/dashboard" ? "font-medium text-primary" : "text-muted-foreground"}`}
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className={`text-sm ${pathname === "/profile" ? "font-medium text-primary" : "text-muted-foreground"}`}
            >
              Profile
            </Link>
          </div>
        </div>
        <Button variant="ghost" onClick={() => signOut()}>
          Sign Out
        </Button>
      </div>
    </nav>
  )
}
