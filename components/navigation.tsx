"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { BarChart2, Calendar, LayoutDashboard, LogOut, Settings, User } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const isActive = (path: string) => pathname === path

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/activity", label: "Activity", icon: BarChart2 },
    { href: "/categories", label: "Categories", icon: Calendar },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <nav className="flex flex-col space-y-1 p-2">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <Button
            key={item.href}
            variant={isActive(item.href) ? "secondary" : "ghost"}
            size="sm"
            className="justify-start"
            asChild
          >
            <Link href={item.href}>
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        )
      })}

      {user && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      )}
    </nav>
  )
}
