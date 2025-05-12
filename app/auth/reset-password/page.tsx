"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, AlertCircle, CheckCircle, Loader2, Info } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"

// Form validation schema
const resetSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

type ResetFormValues = z.infer<typeof resetSchema>

// Helper to determine if we're in a preview environment
const isPreviewEnv = () => {
  return (
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" && window.location.hostname === "localhost")
  )
}

export default function ResetPasswordPage() {
  const { toast } = useToast()
  const { resetPassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [resetRequested, setResetRequested] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPreviewEnvironment, setIsPreviewEnvironment] = useState(false)

  // Check environment on mount
  useEffect(() => {
    setIsPreviewEnvironment(isPreviewEnv())
  }, [])

  // Initialize form with react-hook-form
  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  })

  // Simulation mode for preview environments
  const handleSimulatedSubmit = (values: ResetFormValues) => {
    setLoading(true)
    setError(null)

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setResetRequested(true)
      toast({
        title: "Demo Mode: Password reset email sent",
        description: `In a production environment, a reset link would be sent to ${values.email}.`,
      })
      form.reset()
    }, 1500)
  }

  // Real submission for production environments
  const handleRealSubmit = async (values: ResetFormValues) => {
    try {
      // Clear any previous states
      setLoading(true)
      setResetRequested(false)
      setError(null)

      console.log("Submitting reset request for:", values.email)

      const { error: resetError } = await resetPassword(values.email)

      if (resetError) {
        console.error("Reset error:", resetError)
        setError(resetError.message || "Failed to send reset email. Please try again.")

        toast({
          title: "Password reset failed",
          description: resetError.message || "Please try again",
          variant: "destructive",
        })
        return
      }

      // Handle success
      setResetRequested(true)
      toast({
        title: "Password reset email sent",
        description: "Check your email for a link to reset your password.",
      })
      // Reset the form
      form.reset()
    } catch (err: any) {
      console.error("Password reset error:", err)

      // Check for JSON parsing errors
      if (err.message && err.message.includes("not valid JSON")) {
        console.log("JSON parsing error detected, switching to preview mode")
        setIsPreviewEnvironment(true)
        // Try again in simulation mode
        handleSimulatedSubmit(values)
        return
      }

      setError("An unexpected error occurred. Please try again later.")
      toast({
        title: "Password reset failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Choose the appropriate submit handler based on environment
  const onSubmit = (values: ResetFormValues) => {
    if (isPreviewEnvironment) {
      handleSimulatedSubmit(values)
    } else {
      handleRealSubmit(values).catch((err) => {
        // If we get here, something went really wrong
        console.error("Unhandled error in form submission:", err)
        setError("A critical error occurred. Please try again later.")
        setLoading(false)
      })
    }
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset your password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
          {isPreviewEnvironment && (
            <Alert className="mt-2 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <AlertDescription className="text-blue-700">
                <strong>Demo Mode:</strong> Password reset emails won't be sent in this environment. This is a
                simulation for demonstration purposes.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && !isPreviewEnvironment && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {resetRequested ? (
            <Alert className="bg-green-50 border-green-200" role="status">
              <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
              <AlertDescription className="text-green-600">
                {isPreviewEnvironment
                  ? "In a production environment, a reset link would be sent to your email."
                  : "Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder."}
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            className="pl-10"
                            type="email"
                            autoComplete="email"
                            disabled={loading}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Sending reset link...</span>
                    </>
                  ) : isPreviewEnvironment ? (
                    "Simulate Reset Email"
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
