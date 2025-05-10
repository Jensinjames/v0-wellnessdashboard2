"use client"

import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

export function useSafeNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const navigate = useCallback(
    (path: string) => {
      if (mounted) {
        router.push(path)
      }
    },
    [mounted, router],
  )

  return {
    navigate,
    pathname: mounted ? pathname : null,
    isReady: mounted,
  }
}
