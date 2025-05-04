"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, Calendar, Settings, User, PieChart, Activity, Home, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMobile } from "@/hooks/use-mobile"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems: NavItem[] = [
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
      title: "Categories",
      href: "/categories",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      title: "Activity Patterns",
      href: "/activity-patterns",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Calendar",
      href: "/calendar",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Profile",
      href: "/profile",
      icon: <User className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <BarChart3 className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <div className="py-4">
            <h2 className="px-4 text-lg font-semibold tracking-tight mb-4">Navigation</h2>
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="space-y-1 p-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                      pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-[240px]",
      )}
    >
      <div className="flex h-14 items-center px-4 py-2 border-b">
        {!isCollapsed && <h2 className="text-lg font-semibold tracking-tight">Navigation</h2>}
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto", isCollapsed && "mx-auto")}
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className={cn("space-y-1 p-2", isCollapsed && "flex flex-col items-center p-1")}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                isCollapsed && "flex h-10 w-10 justify-center p-0",
              )}
              title={isCollapsed ? item.title : undefined}
            >
              {item.icon}
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
