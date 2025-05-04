"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function RedirectHandler() {
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true)

    // Only run this effect on the client side
    if (typeof window !== "undefined") {
      // Check if there's a redirect path stored in session storage
      const redirectPath = sessionStorage.getItem("redirectAfterAuth")

      if (redirectPath) {
        // Clear the stored path
        sessionStorage.removeItem("redirectAfterAuth")

        // Redirect to the stored path
        router.push(redirectPath)
      }
    }
  }, [router])

  // This component doesn't render anything visible
  return null
}

// Add default export for dynamic import
export default RedirectHandler
