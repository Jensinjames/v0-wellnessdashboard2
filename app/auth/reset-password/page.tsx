"use client"

import { useState } from "react"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { usePasswordReset } from "@/hooks/auth/use-password-reset"
import { useToast } from "@/hooks/use-toast"

// Form validation schema
const resetSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

type ResetFormValues = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const { toast } = useToast()
  const { requestReset, loading, success, error } = usePasswordReset()
  const [resetRequested, setResetRequested] = useState(false)

  // Initialize form with react-hook-form
  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  })

  // Handle form submission
  const onSubmit = async (values: ResetFormValues) => {
    try {
      // Clear any previous success state
      setResetRequested(false)

      console.log("Submitting reset request for:", values.email)
      const { success, error } = await requestReset(values.email)

      if (error) {
        console.error("Reset error:", error)
        toast({
          title: "Password reset failed",
          description: error.message || "Please try again",
          variant: "destructive",
        })
        return
      }

      if (success) {
        setResetRequested(true)
        toast({
          title: "Password reset email sent",
          description: "Check your email for a link to reset your password.",
        })
        // Reset the form
        form.reset()
      }
    } catch (err) {
      console.error("Password reset error:", err)
      toast({
        title: "Password reset failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
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
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {resetRequested ? (
            <Alert className="bg-green-50 border-green-200" role="status">
              <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
              <AlertDescription className="text-green-600">
                Check your email for a link to reset your password. If it doesn't appear within a few minutes, check
                your spam folder.
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
