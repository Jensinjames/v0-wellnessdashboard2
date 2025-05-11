"use client"
import { BarChart3, Home, ListTodo, Settings, Timer } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useUniqueId } from "@/utils/unique-id"

export function MobileNav() {
  const isMobile = useIsMobile()
  const navId = useUniqueId("mobile-nav")

  if (!isMobile) return null

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 w-full border-t bg-background md:hidden"
      aria-label="Mobile navigation"
      id={navId}
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        <a
          href="/"
          className="flex flex-col items-center justify-center px-4 py-2 text-primary"
          aria-label="Go to home page"
          aria-current="page"
        >
          <Home className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs">Home</span>
        </a>
        <a
          href="/categories"
          className="flex flex-col items-center justify-center px-4 py-2 text-muted-foreground"
          aria-label="Manage wellness categories"
        >
          <ListTodo className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs">Categories</span>
        </a>
        <a
          href="/tracking"
          className="flex flex-col items-center justify-center px-4 py-2 text-muted-foreground"
          aria-label="Track wellness activities"
        >
          <Timer className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs">Track</span>
        </a>
        <a
          href="/activity-patterns"
          className="flex flex-col items-center justify-center px-4 py-2 text-muted-foreground"
          aria-label="View activity patterns"
        >
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs">Activity Patterns</span>
        </a>
        <a
          href="/trends"
          className="flex flex-col items-center justify-center px-4 py-2 text-muted-foreground"
          aria-label="View wellness statistics and trends"
        >
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs">Stats</span>
        </a>
        <a
          href="/settings"
          className="flex flex-col items-center justify-center px-4 py-2 text-muted-foreground"
          aria-label="Manage application settings"
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs">Settings</span>
        </a>
      </div>
    </nav>
  )
}
