"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigation } from "@/hooks/use-navigation"

export function Navigation() {
  const { user, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { goBack, getPreviousPath } = useNavigation()

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <nav className="border-b bg-background sticky top-0 z-50" aria-label="Main Navigation">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold hidden md:block">Wellness Dashboard</div>
          </div>
        </div>
      </nav>
    )
  }

  const canGoBack = getPreviousPath() !== null && pathname !== "/dashboard"

  if (!user) return null

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/goals", label: "Goals" },
    { path: "/categories", label: "Categories" },
    { path: "/profile", label: "Profile" },
    { path: "/profile/verification", label: "Verification" },
  ]

  return (
    <nav className="border-b bg-background sticky top-0 z-50" aria-label="Main Navigation">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          {canGoBack && (
            <Button variant="ghost" size="icon" onClick={() => goBack()} className="mr-2" aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <Link href="/dashboard" className="text-xl font-bold hidden md:block" aria-label="Wellness Dashboard Home">
            Wellness Dashboard
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex gap-4" role="menubar" aria-label="Main Menu">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`text-sm ${pathname === item.path ? "font-medium text-primary" : "text-muted-foreground"}`}
                role="menuitem"
                aria-current={pathname === item.path ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Button variant="ghost" onClick={() => signOut()} aria-label="Sign Out">
            Sign Out
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t p-4">
          <div className="flex flex-col space-y-3" role="menubar" aria-label="Mobile Menu">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`text-sm p-2 ${pathname === item.path ? "font-medium text-primary bg-muted rounded-md" : "text-muted-foreground"}`}
                role="menuitem"
                aria-current={pathname === item.path ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Button
              variant="ghost"
              onClick={() => {
                setMobileMenuOpen(false)
                signOut()
              }}
              className="justify-start p-2 h-auto font-normal"
              aria-label="Sign Out"
            >
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
