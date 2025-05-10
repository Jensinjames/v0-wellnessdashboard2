"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"

// Form schema with validation
const formSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Please enter a valid email address" }),
})

type FormValues = z.infer<typeof formSchema>

export function ForgotPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resetPassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEmailServiceDown, setIsEmailServiceDown] = useState(false)
  const [isExpiredLink, setIsExpiredLink] = useState(false)

  // Check for expired error in URL
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "expired") {
      setIsExpiredLink(true)
      setError("Your password reset link has expired. Please request a new one.")
    }
  }, [searchParams])

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    setError(null)
    setIsEmailServiceDown(false)

    try {
      // Send password reset email
      const result = await resetPassword(data.email)

      if (!result.success) {
        console.error("Password reset error:", result.error)

        if (result.isEmailError) {
          setIsEmailServiceDown(true)
          setError("Our email service is temporarily unavailable. Please try again later or contact support.")
        } else {
          setError(result.error || "Failed to send password reset email. Please try again.")
        }
      } else {
        // Success - email was sent
        setEmailSent(true)
      }
    } catch (err: any) {
      console.error("Password reset exception:", err)
      setError(err.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // If email was sent successfully, show success message
  if (emailSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>We've sent a password reset link to your email address.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Please check your inbox and follow the instructions to reset your password. If you don't see the email,
            check your spam folder.
          </p>
          <Button variant="outline" className="w-full" onClick={() => router.push("/auth/sign-in")}>
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isExpiredLink ? "Reset Link Expired" : "Reset your password"}</CardTitle>
        <CardDescription>
          {isExpiredLink
            ? "Your password reset link has expired. Please request a new one."
            : "Enter your email address and we'll send you a link to reset your password."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your.email@example.com"
                      type="email"
                      autoComplete="email"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isEmailServiceDown && (
              <Alert variant="warning" className="bg-amber-50 text-amber-800 border-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Our email service is currently experiencing issues. Please try again later or contact support.
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <Button variant="link" onClick={() => router.push("/auth/sign-in")}>
          Back to Sign In
        </Button>
      </CardFooter>
    </Card>
  )
}
