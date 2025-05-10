"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { signOut } from "@/app/actions/auth"

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
      setIsLoading(false)
    }
  }

  return (
    <form action={signOut}>
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        disabled={isLoading}
        type="submit"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </form>
  )
}
