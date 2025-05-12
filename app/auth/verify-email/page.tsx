"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, AlertCircle, CheckCircle } from "lucide-react"
import { useSignUp } from "@/hooks/auth"
import { useToast } from "@/hooks/use-toast"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const { toast } = useToast()
  const { resendVerificationEmail, loading, error } = useSignUp()
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    // If no email is provided, we can't resend verification
    if (!email) {
      toast({
        title: "Email required",
        description: "No email address provided for verification",
        variant: "destructive",
      })
    }
  }, [email, toast])

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "No email address provided for verification",
        variant: "destructive",
      })
      return
    }

    setResendSuccess(false)

    try {
      const { error } = await resendVerificationEmail(email)

      if (error) {
        toast({
          title: "Failed to resend verification email",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setResendSuccess(true)
        toast({
          title: "Verification email sent",
          description: "Please check your inbox and follow the link to verify your email",
        })
      }
    } catch (err) {
      console.error("Resend verification error:", err)
      toast({
        title: "Failed to resend verification email",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">
            We've sent a verification email to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {resendSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Verification email has been sent. Please check your inbox.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              <div>
                <h3 className="font-medium">Check your email</h3>
                <p className="text-sm mt-1">
                  Please check your email inbox and click on the verification link to complete your registration. If you
                  don't see the email, check your spam folder.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Didn't receive the email? Check your spam folder or click below to resend.
            </p>
            <Button
              onClick={handleResendVerification}
              disabled={loading || !email}
              variant="outline"
              className="mx-auto"
            >
              {loading ? "Sending..." : "Resend verification email"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Already verified?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
