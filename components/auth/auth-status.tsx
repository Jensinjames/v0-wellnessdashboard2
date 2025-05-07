"use client"

import { useAuthSimplified } from "@/hooks/use-auth-simplified"
import { Button } from "@/components/ui/button"
import { Loader2, LogOut, User } from "lucide-react"

export function AuthStatus() {
  const { user, isLoading, signOut } = useAuthSimplified()

  if (isLoading) {
    return (
      <div className="flex items-center">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span>Loading...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" asChild>
        <a href="/auth/sign-in">Sign In</a>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4" />
        <span className="text-sm font-medium">{user.email}</span>
      </div>
      <Button variant="outline" size="sm" onClick={signOut}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  )
}
