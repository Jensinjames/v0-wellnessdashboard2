"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Activity, BarChart3, Calendar, LayoutDashboard, LogOut, Menu, Settings, User } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { getSupabaseClient } from "@/lib/supabase-client"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const supabase = getSupabaseClient()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error loading profile:", error)
          return
        }

        if (data) {
          setFullName(data.full_name || "")
          setAvatarUrl(data.avatar_url || "")
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      }
    }

    loadProfile()
  }, [user, supabase])

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Add Entry", href: "/add-entry", icon: Calendar },
    { name: "Categories", href: "/categories", icon: BarChart3 },
    { name: "Analytics", href: "/analytics", icon: Activity },
  ]

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="mb-4">Please sign in to access the dashboard.</p>
        <Link href="/auth/signin">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <div className="flex flex-col gap-6 py-4">
                    <Link href="/" className="flex items-center gap-2 px-2">
                      <Activity className="h-6 w-6" />
                      <span className="font-bold">Wellness Dashboard</span>
                    </Link>
                    <nav className="flex flex-col gap-2">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium ${
                            pathname === item.href
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      ))}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <Link href="/" className="flex items-center gap-2">
              <Activity className="h-6 w-6" />
              <span className="font-bold hidden md:inline-block">Wellness Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium ${
                    pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={avatarUrl || "/placeholder.svg?height=32&width=32&query=user"}
                      alt={fullName || user?.email || "User"}
                    />
                    <AvatarFallback>{(user?.email?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{fullName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-6">
        <div className="container px-4">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        <div className="container px-4">
          <p>&copy; {new Date().getFullYear()} Wellness Dashboard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
