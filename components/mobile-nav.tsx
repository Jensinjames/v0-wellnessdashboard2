"use client"
import { BarChart3, Home, ListTodo, Settings, Timer } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MobileNavItemProps {
  href: string
  icon: any
  title: string
  count?: number
}

const items: MobileNavItemProps[] = [
  {
    href: "/",
    icon: Home,
    title: "Home",
  },
  {
    href: "/categories",
    icon: ListTodo,
    title: "Categories",
  },
  {
    href: "/tracking",
    icon: Timer,
    title: "Track",
  },
  {
    href: "/activity-patterns",
    icon: BarChart3,
    title: "Activity Patterns",
  },
  {
    href: "/trends",
    icon: BarChart3,
    title: "Stats",
  },
  {
    href: "/settings",
    icon: Settings,
    title: "Settings",
  },
]

interface MobileNavProps {
  setOpen: (open: boolean) => void
}

export function MobileNav({ setOpen }: MobileNavProps) {
  const isMobile = useIsMobile()
  const pathname = usePathname()

  if (!isMobile) return null

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-background md:hidden">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        <div className="grid gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
              onClick={() => setOpen(false)}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              <span>{item.title}</span>
              {item.count && (
                <Badge variant="secondary" className="ml-auto">
                  {item.count}
                </Badge>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
