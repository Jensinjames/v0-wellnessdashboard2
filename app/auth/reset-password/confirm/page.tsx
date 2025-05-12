"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { usePasswordUpdate } from "@/hooks/auth"
import { useToast } from "@/hooks/use-toast"

// Form validation schema
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordConfirmPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { updatePassword, validateSession, loading, error, success, sessionValid } = usePasswordUpdate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)

  // Initialize form with react-hook-form
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  // Validate session on component mount
  useEffect(() => {
    const checkSession = async () => {
      await validateSession()
      setSessionChecked(true)
    }

    checkSession()
  }, [validateSession])

  // Handle form submission
  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      const { success, error } = await updatePassword(values.password)

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message || "Please try again",
          variant: "destructive",
        })

        // Focus the status message for screen readers
        if (statusRef.current) {
          statusRef.current.focus()
        }
      } else if (success) {
        setResetSuccess(true)
        toast({
          title: "Password reset successful",
          description: "Your password has been updated. You can now log in with your new password.",
        })

        // Focus the status message for screen readers
        if (statusRef.current) {
          statusRef.current.focus()
        }

        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      }
    } catch (err) {
      console.error("Password update error:", err)
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
          <CardDescription className="text-center">Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Session validation status */}
          {!sessionChecked && (
            <div className="flex items-center justify-center p-4" aria-live="polite">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" aria-hidden="true" />
              <span>Validating your session...</span>
            </div>
          )}

          {/* Session error */}
          {sessionChecked && error && !sessionValid && (
            <Alert variant="destructive" ref={statusRef} tabIndex={-1} aria-live="assertive" role="alert">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                {error.message ||
                  "Your password reset link is invalid or has expired. Please request a new password reset."}
              </AlertDescription>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/auth/reset-password">Request new reset link</Link>
                </Button>
              </div>
            </Alert>
          )}

          {/* Success message */}
          {resetSuccess && (
            <Alert
              className="bg-green-50 border-green-200"
              ref={statusRef}
              tabIndex={-1}
              aria-live="assertive"
              role="status"
            >
              <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
              <AlertDescription className="text-green-600">
                Your password has been reset successfully. Redirecting to login...
              </AlertDescription>
            </Alert>
          )}

          {/* Password reset form */}
          {sessionChecked && sessionValid && !resetSuccess && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-labelledby="reset-password-title">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel id="password-label">New Password</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            disabled={loading}
                            aria-labelledby="password-label"
                            aria-invalid={!!form.formState.errors.password}
                            aria-describedby={form.formState.errors.password ? "password-error" : undefined}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-10 w-10"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          aria-pressed={showPassword}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                      <FormMessage id="password-error" aria-live="polite" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel id="confirm-password-label">Confirm Password</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            disabled={loading}
                            aria-labelledby="confirm-password-label"
                            aria-invalid={!!form.formState.errors.confirmPassword}
                            aria-describedby={
                              form.formState.errors.confirmPassword ? "confirm-password-error" : undefined
                            }
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-10 w-10"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                          aria-pressed={showConfirmPassword}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                      <FormMessage id="confirm-password-error" aria-live="polite" />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Resetting password...</span>
                    </>
                  ) : (
                    "Reset password"
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
