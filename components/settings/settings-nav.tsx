"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Database, Shield, Activity, Settings, User, Bell } from 'lucide-react'

const navItems = [
  {
    name: "Profile",
    href: "/dashboard/settings/profile",
    icon: User,
  },
  {
    name: "Database Health",
    href: "/dashboard/settings/database-health",
    icon: Database,
  },
  {
    name: "RLS Optimizer",
    href: "/dashboard/settings/rls-optimizer",
    icon: Shield,
  },
  {
    name: "Performance",
    href: "/dashboard/settings/performance",
    icon: Activity,
  },
  {
    name: "Notifications",
    href: "/dashboard/settings/notifications",
    icon: Bell,
  },
  {
    name: "General",
    href: "/dashboard/settings",
    icon: Settings,
    exact: true,
  },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col space-y-1">
      {navItems.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
