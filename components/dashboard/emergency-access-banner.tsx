"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export function EmergencyAccessBanner() {
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()
  const { signOut } = useAuth()

  useEffect(() => {
    // Check if we're in emergency access mode
    const emergencyAccess = localStorage.getItem("emergency_access")
    if (emergencyAccess) {
      try {
        const { email } = JSON.parse(emergencyAccess)
        setEmail(email)
        setIsEmergencyMode(true)
      } catch (error) {
        console.error("Error parsing emergency access data:", error)
      }
    }
  }, [])

  if (!isEmergencyMode) {
    return null
  }

  return (
    <Alert variant="destructive" className="rounded-none">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Emergency Access Mode</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>You are using emergency access mode for {email}. Some features may be limited.</span>
        <Button
          variant="outline"
          size="sm"
          className="bg-white text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => signOut().then(() => router.push("/auth/sign-in"))}
        >
          Exit Emergency Mode
        </Button>
      </AlertDescription>
    </Alert>
  )
}
