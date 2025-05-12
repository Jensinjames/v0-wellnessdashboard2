"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, User, Settings, LogOut, BarChart2, Activity, List, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/enhanced-theme-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const routes = [
  {
    href: "/",
    label: "Dashboard",
    icon: Home,
  },
  {
    href: "/activity",
    label: "Activity Entry",
    icon: Activity,
  },
  {
    href: "/categories",
    label: "Categories",
    icon: List,
  },
  {
    href: "/activity-patterns",
    label: "Activity Patterns",
    icon: BarChart2,
  },
]

export function NavigationHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Wellness Dashboard</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === route.href ? "text-foreground" : "text-foreground/60",
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2 md:hidden" aria-label="Toggle navigation menu">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <MobileNav pathname={pathname} setOpen={setOpen} />
          </SheetContent>
        </Sheet>

        <Link href="/" className="mr-6 flex items-center space-x-2 md:hidden">
          <span className="font-bold">Wellness</span>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="flex items-center">
            <UserAccountNav />
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function MobileNav({ pathname, setOpen }: { pathname: string; setOpen: (open: boolean) => void }) {
  return (
    <div className="flex flex-col space-y-3 px-4 py-2">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
          <span className="font-bold">Wellness Dashboard</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close navigation menu">
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex flex-col space-y-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center rounded-md px-2 py-1.5 text-sm font-medium",
              pathname === route.href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <route.icon className="mr-2 h-4 w-4" />
            {route.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function UserAccountNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
          <User className="h-4 w-4" />
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
