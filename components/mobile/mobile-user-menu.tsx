"use client"

import { LogOut, Settings, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function MobileUserMenu() {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src="/placeholder.svg?height=48&width=48" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">User Profile</h2>
          <p className="text-sm text-muted-foreground">user@example.com</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <User className="h-4 w-4" />
          Profile
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-600">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
