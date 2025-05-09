"use client"

import { RedirectTester } from "@/components/debug/redirect-tester"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RedirectDebugPage() {
  const [redirectPath, setRedirectPath] = useState("/")
  const router = useRouter()

  const simulateRedirect = () => {
    router.push(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectPath)}`)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">Redirect Debugging</h1>

      <RedirectTester />

      <Card>
        <CardHeader>
          <CardTitle>Simulate Redirect Flow</CardTitle>
          <CardDescription>Test the full redirect flow by simulating a sign-in redirect</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <Button
                variant="outline"
                onClick={() => setRedirectPath("/")}
                className={redirectPath === "/" ? "border-blue-500 bg-blue-50" : ""}
              >
                Root (/)
              </Button>
              <Button
                variant="outline"
                onClick={() => setRedirectPath("/dashboard")}
                className={redirectPath === "/dashboard" ? "border-blue-500 bg-blue-50" : ""}
              >
                Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => setRedirectPath("/profile")}
                className={redirectPath === "/profile" ? "border-blue-500 bg-blue-50" : ""}
              >
                Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => setRedirectPath("/app/settings")}
                className={redirectPath === "/app/settings" ? "border-blue-500 bg-blue-50" : ""}
              >
                App Settings
              </Button>
            </div>

            <div className="flex justify-end">
              <Button onClick={simulateRedirect}>Simulate Sign-in with Redirect</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
