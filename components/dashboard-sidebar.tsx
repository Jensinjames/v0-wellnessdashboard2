"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserProfile } from "@/components/auth/user-profile"
import { BarChart, Home, Settings, ListTodo, Activity, LayoutDashboard, Database } from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardSidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12 hidden md:block border-r", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Wellness Dashboard</h2>
          <UserProfile />
        </div>
        <div className="px-3">
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-1">
              <Button asChild variant={pathname === "/" ? "secondary" : "ghost"} className="w-full justify-start">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
              <Button
                asChild
                variant={pathname === "/activity" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Link href="/activity">
                  <Activity className="mr-2 h-4 w-4" />
                  Activity
                </Link>
              </Button>
              <Button
                asChild
                variant={pathname === "/categories" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Link href="/categories">
                  <ListTodo className="mr-2 h-4 w-4" />
                  Categories
                </Link>
              </Button>
              <Button
                asChild
                variant={pathname === "/activity-patterns" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Link href="/activity-patterns">
                  <BarChart className="mr-2 h-4 w-4" />
                  Patterns
                </Link>
              </Button>
              <Button
                asChild
                variant={pathname === "/category-management" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Link href="/category-management">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Management
                </Link>
              </Button>
              <Button
                asChild
                variant={pathname === "/data-management" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Link href="/data-management">
                  <Database className="mr-2 h-4 w-4" />
                  Data
                </Link>
              </Button>
              <Button
                asChild
                variant={pathname === "/settings" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
