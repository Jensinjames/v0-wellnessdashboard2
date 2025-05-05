"use client"

import { Bell, Plus, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { MobileUserMenu } from "./mobile-user-menu"

interface MobileHeaderProps {
  onAddEntry: () => void
}

export function MobileHeader({ onAddEntry }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-primary-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold">Wellness</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="default" size="icon" className="h-8 w-8 rounded-full" onClick={onAddEntry}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add Entry</span>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <User className="h-4 w-4" />
                <span className="sr-only">User Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[400px]">
              <MobileUserMenu />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
