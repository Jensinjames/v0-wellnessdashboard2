"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export default function VerifyEmail() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            We&apos;ve sent you a verification link. Please check your email and click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>If you don&apos;t see the email, check your spam folder or junk mail.</p>
          <p className="mt-2">The verification link will expire in 24 hours.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/signin">
            <Button variant="outline">Back to sign in</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
