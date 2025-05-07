"use client"

import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { signOut } from "@/app/actions/auth"

interface SignOutButtonProps extends ButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export default function SignOutButton({ children = "Sign Out", variant = "default", ...props }: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    await signOut()
  }

  return (
    <Button variant={variant} onClick={handleSignOut} disabled={isLoading} {...props}>
      {isLoading ? "Signing out..." : children}
    </Button>
  )
}
