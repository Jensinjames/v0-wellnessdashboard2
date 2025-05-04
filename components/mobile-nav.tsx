"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface NavItem {
  title: string
  href: string
}

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/",
    },
    {
      title: "Activity",
      href: "/activity",
    },
    {
      title: "Categories",
      href: "/categories",
    },
    {
      title: "Profile",
      href: "/profile",
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px]">
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex items-center justify-between h-14 px-4 border-b">
            <Link href="/" className="font-bold" onClick={() => setOpen(false)}>
              Wellness Dashboard
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          <nav className="flex-1 px-2 py-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
