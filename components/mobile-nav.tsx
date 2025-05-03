"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UserProfile } from "@/components/auth/user-profile"
import { Home, ListTodo, Activity, LayoutDashboard } from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t">
      <div className="grid h-full grid-cols-5">
        <Link
          href="/"
          className={cn(
            "inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800",
            pathname === "/" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link
          href="/activity"
          className={cn(
            "inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800",
            pathname === "/activity" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Activity className="w-5 h-5" />
          <span className="text-xs mt-1">Activity</span>
        </Link>
        <Link
          href="/categories"
          className={cn(
            "inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800",
            pathname === "/categories" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <ListTodo className="w-5 h-5" />
          <span className="text-xs mt-1">Categories</span>
        </Link>
        <Link
          href="/category-management"
          className={cn(
            "inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800",
            pathname === "/category-management" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-xs mt-1">Manage</span>
        </Link>
        <div className="inline-flex flex-col items-center justify-center px-5">
          <UserProfile />
          <span className="text-xs mt-1">Profile</span>
        </div>
      </div>
    </div>
  )
}
