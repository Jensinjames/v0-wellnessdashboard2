"use client"

import type React from "react"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { storeCurrentUrlForRedirect } from "@/utils/redirect-manager"
import { RedirectErrorBoundary } from "@/components/redirect-error-boundary"

interface RedirectProviderProps {
  children: React.ReactNode
}

export function RedirectProvider({ children }: RedirectProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Store the current URL for potential redirects if it's not an auth page
  useEffect(() => {
    if (pathname && !pathname.startsWith("/auth/")) {
      storeCurrentUrlForRedirect()
    }
  }, [pathname, searchParams])

  return <RedirectErrorBoundary>{children}</RedirectErrorBoundary>
}
