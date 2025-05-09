"use client"

import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Info, X } from "lucide-react"
import Link from "next/link"

export function AnonymousUserBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) {
    return null
  }

  return (
    <Alert className="bg-blue-50 border-blue-200 mb-4">
      <div className="flex items-start">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
        <div className="flex-1">
          <AlertTitle className="text-blue-800">You're using demo mode</AlertTitle>
          <AlertDescription className="text-blue-700 mt-1">
            <p className="mb-2">
              You're currently using the application in demo mode with an anonymous account. Your data will be
              accessible only during this session and may be deleted after a period of inactivity.
            </p>
            <div className="mt-2">
              <Link href="/auth/sign-up">
                <Button size="sm" variant="outline" className="bg-blue-100 border-blue-300 text-blue-800 mr-2">
                  Create an account
                </Button>
              </Link>
              <Link href="/auth/sign-in">
                <Button size="sm" variant="outline" className="bg-blue-100 border-blue-300 text-blue-800">
                  Sign in
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-blue-600" />
        </Button>
      </div>
    </Alert>
  )
}
