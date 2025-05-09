"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import { createLogger } from "@/utils/logger"
import { handleAuthError } from "@/utils/auth-error-handler"

// Create a dedicated logger for the sign-in form
const logger = createLogger("SignInForm")

// Define the form schema
const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type FormData = z.infer<typeof formSchema>

export function EnhancedSignInForm() {
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  // Get the redirect URL from the query string
  const redirectTo = searchParams?.get("redirectTo") || "/dashboard"

  // Initialize the form
  const {
    register,
    handleSubmit: hookFormSubmit,
    formState: { errors },
    setError: setFieldError,
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Handle form submission
  const handleSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError(null)
      setIsRetrying(false)

      // Log the attempt (without sensitive data)
      logger.info("Attempting sign-in", {
        emailProvided: !!data.email,
        passwordProvided: !!data.password,
      })

      // Call the signIn function from the auth context
      const {
        error: signInError,
        fieldErrors,
        retried,
      } = await signIn(
        {
          email: data.email,
          password: data.password,
        },
        redirectTo,
      )

      // Update retrying state based on response
      setIsRetrying(retried || false)

      // Handle field-specific errors
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          if (message && (field === "email" || field === "password")) {
            setFieldError(field as "email" | "password", {
              type: "manual",
              message,
            })
          }
        })
      }

      // Handle general errors
      if (signInError) {
        // Special handling for 500 errors
        if (signInError.message.includes("temporarily unavailable")) {
          setError("Authentication service is temporarily unavailable. We're automatically retrying your request.")
        } else {
          // Process other errors
          const authError = handleAuthError(signInError, { email: data.email })
          setError(authError.message)
        }
      }
    } catch (err) {
      logger.error("Unexpected error during sign-in:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle manual retry
  const handleRetry = () => {
    const values = getValues()
    handleSubmit(values)
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={hookFormSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={isLoading}
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
              {...register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </Button>
          </div>
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        {error && (
          <Alert variant={error.includes("temporarily unavailable") ? "warning" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{error}</span>
              {error.includes("temporarily unavailable") && !isRetrying && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full sm:w-auto"
                  onClick={handleRetry}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Manually
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isRetrying ? "Retrying authentication..." : "Signing in..."}
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/auth/sign-up" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  )
}
