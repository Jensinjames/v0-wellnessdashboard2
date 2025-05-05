"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, Home, PlusCircle, Settings, LayoutDashboard, Radio } from "lucide-react"

const routes = [
  {
    label: "Home",
    icon: Home,
    href: "/",
    color: "text-sky-500",
  },
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-violet-500",
  },
  {
    label: "Real-time Dashboard",
    icon: Radio,
    href: "/realtime-dashboard",
    color: "text-green-500",
  },
  {
    label: "Add Entry",
    icon: PlusCircle,
    href: "/add-entry",
    color: "text-orange-500",
  },
  {
    label: "Real-time Entry",
    icon: PlusCircle,
    href: "/realtime-entry",
    color: "text-green-500",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    href: "/analytics",
    color: "text-pink-700",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-gray-500",
  },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Wellness Dashboard</h2>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center justify-start w-full rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                pathname === route.href ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <route.icon className={cn("mr-2 h-4 w-4", route.color)} />
              {route.label}
              {route.href === "/realtime-dashboard" && (
                <span className="ml-auto flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
