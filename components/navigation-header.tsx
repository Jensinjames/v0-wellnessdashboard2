"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/actions/auth-actions"
import { ThemeToggle } from "@/components/enhanced-theme-provider"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"

export function NavigationHeader() {
  const pathname = usePathname()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [open, setOpen] = useState(false)
  const navId = "main-navigation"
  const mobileNavId = "mobile-navigation"

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-950 dark:border-slate-800"
      role="banner"
    >
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/" className="flex items-center space-x-2" aria-label="Rollen Wellness home">
            <span className="text-xl font-bold">Rollen Wellness</span>
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                aria-expanded={open}
                aria-controls={mobileNavId}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <div className="flex items-center justify-between py-2">
                <Link
                  href="/"
                  className="text-lg font-medium"
                  onClick={() => setOpen(false)}
                  aria-label="Rollen Wellness home"
                >
                  Rollen Wellness
                </Link>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Close navigation menu">
                    <X className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Close</span>
                  </Button>
                </SheetClose>
              </div>
              <nav id={mobileNavId} className="flex flex-col gap-3 py-4" aria-label="Mobile navigation">
                <ul className="flex flex-col gap-3 list-none p-0 m-0">
                  <li>
                    <Link
                      href="/"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        pathname === "/" ? "text-primary" : "text-muted-foreground"
                      }`}
                      onClick={() => setOpen(false)}
                      aria-current={pathname === "/" ? "page" : undefined}
                    >
                      Home
                    </Link>
                  </li>
                  {isAuthenticated && (
                    <>
                      <li>
                        <Link
                          href="/dashboard"
                          className={`text-sm font-medium transition-colors hover:text-primary ${
                            pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                          }`}
                          onClick={() => setOpen(false)}
                          aria-current={pathname === "/dashboard" ? "page" : undefined}
                        >
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/profile"
                          className={`text-sm font-medium transition-colors hover:text-primary ${
                            pathname === "/profile" ? "text-primary" : "text-muted-foreground"
                          }`}
                          onClick={() => setOpen(false)}
                          aria-current={pathname === "/profile" ? "page" : undefined}
                        >
                          Profile
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/activity"
                          className={`text-sm font-medium transition-colors hover:text-primary ${
                            pathname === "/activity" ? "text-primary" : "text-muted-foreground"
                          }`}
                          onClick={() => setOpen(false)}
                          aria-current={pathname === "/activity" ? "page" : undefined}
                        >
                          Activity
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/categories"
                          className={`text-sm font-medium transition-colors hover:text-primary ${
                            pathname === "/categories" ? "text-primary" : "text-muted-foreground"
                          }`}
                          onClick={() => setOpen(false)}
                          aria-current={pathname === "/categories" ? "page" : undefined}
                        >
                          Categories
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/activity-patterns"
                          className={`text-sm font-medium transition-colors hover:text-primary ${
                            pathname === "/activity-patterns" ? "text-primary" : "text-muted-foreground"
                          }`}
                          onClick={() => setOpen(false)}
                          aria-current={pathname === "/activity-patterns" ? "page" : undefined}
                        >
                          Activity Patterns
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>

          <nav id={navId} className="hidden md:block" aria-label="Main navigation">
            <ul className="flex gap-6 list-none p-0 m-0">
              <li>
                <Link
                  href="/"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/" ? "text-primary" : "text-muted-foreground"
                  }`}
                  aria-current={pathname === "/" ? "page" : undefined}
                >
                  Home
                </Link>
              </li>
              {isAuthenticated && (
                <>
                  <li>
                    <Link
                      href="/dashboard"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                      }`}
                      aria-current={pathname === "/dashboard" ? "page" : undefined}
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/profile"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        pathname === "/profile" ? "text-primary" : "text-muted-foreground"
                      }`}
                      aria-current={pathname === "/profile" ? "page" : undefined}
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/activity"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        pathname === "/activity" ? "text-primary" : "text-muted-foreground"
                      }`}
                      aria-current={pathname === "/activity" ? "page" : undefined}
                    >
                      Activity
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/categories"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        pathname === "/categories" ? "text-primary" : "text-muted-foreground"
                      }`}
                      aria-current={pathname === "/categories" ? "page" : undefined}
                    >
                      Categories
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/activity-patterns"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        pathname === "/activity-patterns" ? "text-primary" : "text-muted-foreground"
                      }`}
                      aria-current={pathname === "/activity-patterns" ? "page" : undefined}
                    >
                      Activity Patterns
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isLoading ? (
            <span className="text-sm text-muted-foreground" aria-live="polite">
              Loading...
            </span>
          ) : isAuthenticated ? (
            <Button onClick={handleSignOut} variant="outline" size="sm" aria-label="Sign out of your account">
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
