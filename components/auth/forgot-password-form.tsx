"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Only use auth hook on the client side
  const auth = useAuth()
  const { resetPassword } = auth || { resetPassword: null }

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    if (!resetPassword) {
      setError("Authentication is not available. Please try again later.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await resetPassword(values.email)

      if (error) {
        setError(error.message)
        return
      }

      setIsSubmitted(true)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // If not on client yet, show a simple loading state
  if (!isClient) {
    return (
      <>
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>Loading form...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
        </CardContent>
      </>
    )
  }

  if (isSubmitted) {
    return (
      <>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>We've sent a password reset link to your email address.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Please check your email for further instructions.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/sign-in">
            <Button variant="outline">Back to sign in</Button>
          </Link>
        </CardFooter>
      </>
    )
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>Enter your email to reset your password</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/auth/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </>
  )
}

// Add default export for dynamic import
export default ForgotPasswordForm
