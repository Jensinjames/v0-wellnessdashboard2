"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Database, Shield, Activity, Settings } from "lucide-react"

const navItems = [
  {
    name: "Database Health",
    href: "/debug/database-health",
    icon: Database,
  },
  {
    name: "RLS Optimizer",
    href: "/admin/database/rls-optimizer",
    icon: Shield,
  },
  {
    name: "Performance",
    href: "/admin/performance",
    icon: Activity,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link href="/admin" className="text-lg font-bold">
        Admin
      </Link>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href ? "text-primary" : "text-muted-foreground",
          )}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.name}
        </Link>
      ))}
    </nav>
  )
}
