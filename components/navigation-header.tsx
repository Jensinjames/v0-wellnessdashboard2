"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/actions/auth-actions"
import { ThemeToggle } from "@/components/enhanced-theme-provider"
import { Menu } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function NavigationHeader() {
  const pathname = usePathname()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-950 dark:border-slate-800">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Rollen Wellness</span>
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <div className="flex flex-col gap-4 py-4">
                <Link href="/" className="text-lg font-medium" onClick={() => setOpen(false)}>
                  Rollen Wellness
                </Link>
                <nav className="flex flex-col gap-3">
                  <Link
                    href="/"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === "/" ? "text-primary" : "text-muted-foreground"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    Home
                  </Link>
                  {isAuthenticated && (
                    <>
                      <Link
                        href="/dashboard"
                        className={`text-sm font-medium transition-colors hover:text-primary ${
                          pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        className={`text-sm font-medium transition-colors hover:text-primary ${
                          pathname === "/profile" ? "text-primary" : "text-muted-foreground"
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/activity"
                        className={`text-sm font-medium transition-colors hover:text-primary ${
                          pathname === "/activity" ? "text-primary" : "text-muted-foreground"
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        Activity
                      </Link>
                      <Link
                        href="/categories"
                        className={`text-sm font-medium transition-colors hover:text-primary ${
                          pathname === "/categories" ? "text-primary" : "text-muted-foreground"
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        Categories
                      </Link>
                      <Link
                        href="/activity-patterns"
                        className={`text-sm font-medium transition-colors hover:text-primary ${
                          pathname === "/activity-patterns" ? "text-primary" : "text-muted-foreground"
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        Activity Patterns
                      </Link>
                    </>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <nav className="hidden md:flex gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/profile" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Profile
                </Link>
                <Link
                  href="/activity"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/activity" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Activity
                </Link>
                <Link
                  href="/categories"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/categories" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Categories
                </Link>
                <Link
                  href="/activity-patterns"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/activity-patterns" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Activity Patterns
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isLoading ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : isAuthenticated ? (
            <Button onClick={handleSignOut} variant="outline" size="sm">
              Sign Out
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
