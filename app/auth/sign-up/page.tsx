import { Suspense } from "react"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignUpPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create a new account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="p-4 text-center">Loading sign-up form...</div>}>
            <SignUpForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  )
}
