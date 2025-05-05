"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { BarChart3, Home, PieChart, Settings, Timer } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNavigation() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/mobile",
      icon: Home,
      label: "Home",
    },
    {
      href: "/mobile/categories",
      icon: PieChart,
      label: "Categories",
    },
    {
      href: "/mobile/tracking",
      icon: Timer,
      label: "Track",
    },
    {
      href: "/mobile/stats",
      icon: BarChart3,
      label: "Stats",
    },
    {
      href: "/mobile/settings",
      icon: Settings,
      label: "Settings",
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 z-10 w-full border-t bg-background">
      <div className="grid h-16 grid-cols-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
