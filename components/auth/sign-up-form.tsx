"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

const signUpSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    rememberMe: z.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type SignUpFormValues = z.infer<typeof signUpSchema>

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signUp } = useAuth()

  // Get the redirect path from URL params or default to dashboard
  const redirectTo = searchParams.get("redirect") || "/dashboard"

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      rememberMe: false,
    },
  })

  const onSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Submitting sign-up form:", { email: values.email, fullName: values.fullName })

      // First step: Create the user account
      const { error: signUpError, data } = await signUp({
        email: values.email,
        password: values.password,
        full_name: values.fullName,
        persistSession: values.rememberMe,
      })

      if (signUpError) {
        console.error("Sign-up error:", signUpError)
        setError(signUpError.message || "Failed to create account. Please try again.")
        setIsLoading(false)
        return
      }

      console.log("Sign-up successful, user created:", data?.user?.id)

      // Second step: Ensure profile exists
      if (data?.user) {
        try {
          setIsCreatingProfile(true)

          // Store the redirect path in session storage to use after email verification
          if (redirectTo) {
            sessionStorage.setItem("redirectAfterAuth", redirectTo)
          }

          setIsSubmitted(true)
        } catch (profileError: any) {
          console.error("Error creating profile:", profileError)
          // Don't show this error to the user since the account was created successfully
          // We'll handle profile creation again on sign-in if needed
        } finally {
          setIsCreatingProfile(false)
        }
      }

      setIsLoading(false)
    } catch (err: any) {
      console.error("Unexpected error during sign-up:", err)
      setError(err.message || "An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <>
        <CardHeader>
          <CardTitle id="verification-title">Check your email</CardTitle>
          <CardDescription id="verification-description">
            We've sent you an email with a link to verify your account. Please check your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4" aria-live="polite">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              If you don't see the email, check your spam folder or{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => {
                  setIsSubmitted(false)
                  setIsLoading(false)
                }}
                aria-label="Try signing up again"
              >
                try again
              </Button>
              .
            </AlertDescription>
          </Alert>
        </CardContent>
      </>
    )
  }

  return (
    <>
      <CardHeader>
        <CardTitle id="sign-up-title">Create an account</CardTitle>
        <CardDescription id="sign-up-description">Enter your information to create an account</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4" aria-live="assertive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            aria-labelledby="sign-up-title"
            aria-describedby="sign-up-description"
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="fullName">Full Name</FormLabel>
                  <FormControl>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      autoComplete="name"
                      aria-describedby="fullName-error"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage id="fullName-error" aria-live="polite" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      autoComplete="email"
                      aria-describedby="email-error"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage id="email-error" aria-live="polite" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-describedby="password-requirements password-error"
                        disabled={isLoading}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription id="password-requirements">
                    Password must be at least 8 characters and include uppercase, lowercase, and numbers.
                  </FormDescription>
                  <FormMessage id="password-error" aria-live="polite" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-describedby="confirmPassword-error"
                        disabled={isLoading}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        aria-pressed={showConfirmPassword}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage id="confirmPassword-error" aria-live="polite" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      id="remember-me"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-describedby="remember-me-description"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="remember-me" className="text-sm font-medium cursor-pointer">
                      Remember me
                    </FormLabel>
                    <p id="remember-me-description" className="sr-only">
                      Keep me signed in on this device
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              aria-disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <span className="sr-only">Creating account, please wait</span>
                  <span aria-hidden="true">Creating account...</span>
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={`/auth/sign-in${redirectTo !== "/dashboard" ? `?redirect=${redirectTo}` : ""}`}
            className="text-primary hover:underline"
            aria-label="Sign in to your existing account"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </>
  )
}

// Add default export
export default SignUpForm
