"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import { createLogger } from "@/utils/logger"
import { resetSupabaseClient } from "@/lib/supabase-client"

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
  const [retryCount, setRetryCount] = useState(0)
  const [isDatabaseError, setIsDatabaseError] = useState(false)
  const [isFixingPermissions, setIsFixingPermissions] = useState(false)
  const MAX_RETRIES = 2

  // Get the redirect URL from the query string
  const redirectTo = searchParams?.get("redirectTo") || "/dashboard"

  // Reset Supabase client on component mount to ensure clean state
  useEffect(() => {
    resetSupabaseClient()
  }, [])

  // Initialize the form
  const {
    register,
    handleSubmit: hookFormSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Function to manually fix database permissions
  const fixDatabasePermissions = async () => {
    try {
      setIsFixingPermissions(true)
      setError("Attempting to fix database permissions...")

      const response = await fetch("/api/auth/fix-database-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const data = await response.json()
        setError(`Failed to fix permissions: ${data.error || "Unknown error"}`)
        setIsFixingPermissions(false)
        return
      }

      setError("Permissions fixed successfully. Please try signing in again.")
      resetSupabaseClient()
      setRetryCount(0)
      setIsDatabaseError(false)
      setIsFixingPermissions(false)
    } catch (err) {
      logger.error("Error fixing permissions:", err)
      setError("Failed to fix permissions. Please try again later.")
      setIsFixingPermissions(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError(null)
      setIsDatabaseError(false)

      // Log the attempt (without sensitive data)
      logger.info("Attempting sign-in", {
        emailProvided: !!data.email,
        passwordProvided: !!data.password,
        retryCount,
      })

      // Call the signIn function from the auth context
      const { error: signInError, data: signInData } = await signIn(data.email, data.password)

      // If successful, redirect
      if (signInData?.session) {
        router.push(redirectTo)
        return
      }

      // Handle errors
      if (signInError) {
        const errorMessage = signInError.message || "An error occurred during sign in"

        // Check for database grant errors
        if (
          errorMessage.includes("Database error granting") ||
          errorMessage.includes("database error") ||
          errorMessage.includes("granting user undefined") ||
          errorMessage.includes("permission denied") ||
          errorMessage.includes("Database permission error")
        ) {
          setIsDatabaseError(true)

          // If we haven't exceeded max retries, try again after a delay
          if (retryCount < MAX_RETRIES) {
            setRetryCount((prev) => prev + 1)
            setError(`Database connection issue. Retrying automatically... (${retryCount + 1}/${MAX_RETRIES})`)

            // Try to fix permissions automatically
            await fixDatabasePermissions()

            // Wait and retry
            setTimeout(
              () => {
                setIsLoading(false)
                hookFormSubmit(handleSubmit)()
              },
              2000 * (retryCount + 1),
            ) // Exponential backoff

            return
          }

          setError("Database permission error. Please try the 'Fix Permissions' button below or contact support.")
        } else {
          setError(errorMessage)
        }

        setIsLoading(false)
        return
      }

      // If we get here without a session or error, something unexpected happened
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    } catch (err) {
      logger.error("Unexpected error during sign-in:", err)
      setError("An unexpected error occurred. Please try again.")
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
            disabled={isLoading || isFixingPermissions}
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
              disabled={isLoading || isFixingPermissions}
              {...register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || isFixingPermissions}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </Button>
          </div>
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        {error && (
          <Alert variant={isDatabaseError ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
            {isDatabaseError && retryCount >= MAX_RETRIES && (
              <div className="mt-2 text-xs">
                <p>This appears to be a database permission issue.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={fixDatabasePermissions}
                  disabled={isFixingPermissions}
                >
                  {isFixingPermissions ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fixing Permissions...
                    </>
                  ) : (
                    "Fix Database Permissions"
                  )}
                </Button>
                <p className="mt-1 text-xs text-center">
                  If the problem persists, please contact support with error code: DB-GRANT-001
                </p>
              </div>
            )}
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || isFixingPermissions}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})...` : "Signing in..."}
            </>
          ) : isFixingPermissions ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fixing Permissions...
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
