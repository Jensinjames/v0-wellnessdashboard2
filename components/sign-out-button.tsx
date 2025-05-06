"use client"

import { Button, type ButtonProps } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { useState } from "react"

interface SignOutButtonProps extends ButtonProps {
  redirectTo?: string
  showIcon?: boolean
}

export function SignOutButton({
  redirectTo = "/auth/signin",
  showIcon = true,
  children,
  ...props
}: SignOutButtonProps) {
  const { signOut } = useAuth()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    router.push(redirectTo)
  }

  return (
    <Button
      variant="destructive"
      onClick={handleSignOut}
      disabled={isSigningOut}
      aria-label="Sign out of your account"
      aria-busy={isSigningOut}
      {...props}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />}
      {children || (isSigningOut ? "Signing out..." : "Sign out")}
      {isSigningOut && <span className="sr-only">Please wait while we sign you out</span>}
    </Button>
  )
}
