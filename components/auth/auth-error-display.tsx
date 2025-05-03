"use client"

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { SessionRefresh } from "./session-refresh"

interface AuthErrorDisplayProps {
  title?: string
  message: string
  showRefresh?: boolean
  showLogin?: boolean
}

export function AuthErrorDisplay({
  title = "Authentication Error",
  message,
  showRefresh = true,
  showLogin = true,
}: AuthErrorDisplayProps) {
  const router = useRouter()

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">{message}</p>
        <div className="flex flex-wrap gap-3">
          {showRefresh && <SessionRefresh />}
          {showLogin && (
            <Button variant="default" size="sm" onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
