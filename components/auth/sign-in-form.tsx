"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import { createLogger } from "@/utils/logger"
import {
  handleAuthError,
  isSchemaError,
  isDatabaseGrantError,
  getTechnicalErrorDetails,
  AuthErrorCategory,
} from "@/utils/auth-error-handler"

// Create a dedicated logger for the sign-in form
const logger = createLogger("SignInForm")

// Define the form schema
const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type FormData = z.infer<typeof formSchema>

export function SignInForm() {
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSchemaIssue, setIsSchemaIssue] = useState(false)
  const [isDatabaseIssue, setIsDatabaseIssue] = useState(false)
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 2

  // Get the redirect URL from the query string
  const redirectTo = searchParams?.get("redirectTo") || "/dashboard"

  // Initialize the form
  const {
    register,
    handleSubmit: hookFormSubmit,
    formState: { errors },
    setError: setFieldError,
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
      setIsSchemaIssue(false)
      setIsDatabaseIssue(false)
      setTechnicalDetails(null)

      // Log the attempt (without sensitive data)
      logger.info("Attempting sign-in", {
        emailProvided: !!data.email,
        passwordProvided: !!data.password,
      })

      // Call the signIn function from the auth context
      const { error: signInError, fieldErrors } = await signIn(
        {
          email: data.email,
          password: data.password,
        },
        redirectTo,
      )

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
        // Process the error
        const authError = handleAuthError(signInError, { email: data.email })

        // Check if it's a database grant error
        if (
          isDatabaseGrantError(signInError) ||
          (signInError.__isAuthError &&
            signInError.message &&
            signInError.message.includes("Database error granting user"))
        ) {
          setIsDatabaseIssue(true)
          setTechnicalDetails(getTechnicalErrorDetails(signInError))
          setError(
            "Database configuration issue detected. This is a server-side setup problem with user permissions. Please contact support.",
          )

          // Log detailed error for debugging
          logger.error("Database grant error details:", {
            error: signInError,
            isAuthError: signInError.__isAuthError,
            status: signInError.status,
            code: signInError.code,
          })

          // No retry for database grant errors
          return
        }

        // Check if it's a schema error
        if (
          isSchemaError(signInError) ||
          (signInError.__isAuthError && signInError.status === 500 && signInError.code === "unexpected_failure")
        ) {
          setIsSchemaIssue(true)
          setTechnicalDetails(getTechnicalErrorDetails(signInError))
          setError(
            "Database configuration issue detected. This is likely a server-side setup problem, not an issue with your credentials.",
          )

          // Log detailed error for debugging
          logger.error("Schema error details:", {
            error: signInError,
            isAuthError: signInError.__isAuthError,
            status: signInError.status,
            code: signInError.code,
          })

          // If we haven't exceeded max retries, try again after a delay
          if (retryCount < MAX_RETRIES) {
            setRetryCount((prev) => prev + 1)
            setError("Database connection issue. Retrying automatically...")

            // Wait and retry
            setTimeout(
              () => {
                handleSubmit(data)
              },
              2000 * (retryCount + 1),
            ) // Exponential backoff

            return
          }
        }

        // Check if it's a database category error
        if (authError.category === AuthErrorCategory.DATABASE) {
          setIsDatabaseIssue(true)
          setTechnicalDetails(getTechnicalErrorDetails(signInError))
          setError(authError.message)

          // Log detailed error for debugging
          logger.error("Database error details:", {
            error: signInError,
            category: authError.category,
            type: authError.type,
          })

          return
        }

        setError(authError.message)
      }
    } catch (err) {
      logger.error("Unexpected error during sign-in:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
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
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </Button>
          </div>
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
            {(isSchemaIssue || isDatabaseIssue) && (
              <div className="mt-2">
                <p className="text-sm font-medium">
                  {isDatabaseIssue
                    ? "This appears to be a database permission issue."
                    : "This appears to be a database configuration issue."}
                </p>
                <p className="text-xs mt-1">
                  Please contact support with the following error code:{" "}
                  {isDatabaseIssue ? "DB-GRANT-001" : "SCHEMA-001"}
                </p>
                {technicalDetails && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer">Technical Details</summary>
                    <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-x-auto">{technicalDetails}</pre>
                  </details>
                )}
              </div>
            )}
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})...` : "Signing in..."}
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
