"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

interface RedirectHandlerProps {
  defaultRedirect?: string
}

export function RedirectHandler({ defaultRedirect = "/dashboard" }: RedirectHandlerProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (user) {
      // Check for stored redirect path
      const storedRedirect = sessionStorage.getItem("redirectAfterAuth")

      // Use stored redirect or default
      const redirectPath = storedRedirect || defaultRedirect

      // Clear stored redirect
      if (storedRedirect) {
        sessionStorage.removeItem("redirectAfterAuth")
      }

      // Redirect user
      router.push(redirectPath)
    }
  }, [user, isLoading, defaultRedirect, router])

  return null
}
