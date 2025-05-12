"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const [errorDescription, setErrorDescription] = useState<string | null>(null)

  useEffect(() => {
    // Get the error description from the URL
    const error = searchParams.get("error_description")
    if (error) {
      // Decode the error description
      setErrorDescription(decodeURIComponent(error))
    } else {
      setErrorDescription("An unknown error occurred during authentication")
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Authentication Error</CardTitle>
          <CardDescription className="text-center">
            There was a problem with your authentication request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 rounded-md text-red-800 mb-4">
            <p className="font-medium">Error details:</p>
            <p className="mt-1">{errorDescription}</p>
          </div>

          <div className="space-y-4">
            <p className="text-center text-sm text-gray-500">
              Please try again or contact support if the problem persists.
            </p>
            <div className="flex flex-col space-y-2">
              <Link href="/auth/login">
                <Button className="w-full" variant="default">
                  Back to login
                </Button>
              </Link>
              <Link href="/">
                <Button className="w-full" variant="outline">
                  Go to homepage
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
