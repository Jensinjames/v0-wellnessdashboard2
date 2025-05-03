"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, Home, LineChart, Settings, Layers, Activity } from "lucide-react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "Activity",
    href: "/activity",
    icon: <Activity className="h-5 w-5" />,
  },
  {
    title: "Activity Patterns",
    href: "/activity-patterns",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Categories",
    href: "/categories",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-sidebar md:block md:w-64 lg:w-72">
      <div className="flex h-full flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <LineChart className="h-6 w-6 text-primary" />
            <span className="text-sidebar-foreground">Wellness Dashboard</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {sidebarItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  pathname === item.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "",
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
