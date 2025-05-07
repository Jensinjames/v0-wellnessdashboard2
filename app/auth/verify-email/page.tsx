import { Suspense } from "react"
import { VerifyEmailForm } from "@/components/auth/verify-email-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyEmailPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Email</CardTitle>
          <CardDescription>Confirm your email address to complete registration</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="p-4 text-center">Verifying your email...</div>}>
            <VerifyEmailForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  )
}
