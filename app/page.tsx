"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { LoadingSection } from "@/components/ui/loading/loading-section"

export default function Home() {
  const router = useRouter()
  const { user, isLoading } = useUser()

  useEffect(() => {
    // Only redirect if we've finished loading and know the user state
    if (!isLoading) {
      if (user) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, isLoading, router])

  // Show loading while determining auth state
  return <LoadingSection />
}
