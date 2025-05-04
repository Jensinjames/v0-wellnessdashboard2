"use client"

import { type ReactNode, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Palette, Bell, Shield, ChevronDown, ChevronUp, SettingsIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SettingsLayoutProps {
  children: ReactNode
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const settingsTabs = [
    {
      name: "Account",
      href: "/settings/account",
      icon: <User className="h-4 w-4 mr-2" />,
      description: "Manage your account details and preferences",
    },
    {
      name: "Appearance",
      href: "/settings/appearance",
      icon: <Palette className="h-4 w-4 mr-2" />,
      description: "Customize the look and feel of the application",
    },
    {
      name: "Notifications",
      href: "/settings/notifications",
      icon: <Bell className="h-4 w-4 mr-2" />,
      description: "Configure how and when you receive notifications",
    },
    {
      name: "Privacy",
      href: "/settings/privacy",
      icon: <Shield className="h-4 w-4 mr-2" />,
      description: "Control your data and privacy preferences",
    },
  ]

  return (
    <div className="container py-8 px-4 md:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <SettingsIcon className="h-6 w-6 mr-2" />
          Settings
        </h1>

        {/* Mobile navigation toggle */}
        <Button
          variant="outline"
          className="md:hidden"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-expanded={mobileNavOpen}
          aria-controls="settings-navigation"
        >
          {mobileNavOpen ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              <span>Hide Navigation</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              <span>Show Navigation</span>
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[250px_1fr]">
        {/* Settings navigation sidebar */}
        <nav
          id="settings-navigation"
          className={cn(
            "bg-card border rounded-lg overflow-hidden transition-all",
            mobileNavOpen ? "max-h-[400px]" : "max-h-0 md:max-h-none",
          )}
          aria-label="Settings navigation"
        >
          <ScrollArea className="h-full max-h-[calc(100vh-200px)]">
            <div className="p-2">
              {settingsTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === tab.href ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground",
                  )}
                  onClick={() => setMobileNavOpen(false)}
                >
                  {tab.icon}
                  <div>
                    <div>{tab.name}</div>
                    <p className="text-xs text-muted-foreground hidden md:block">{tab.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </nav>

        {/* Settings content */}
        <div>
          <Card>
            <CardContent className="p-6">{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
