"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from "lucide-react"

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
  const { signIn, bypassSignIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isDatabaseError, setIsDatabaseError] = useState(false)
  const [isFixingPermissions, setIsFixingPermissions] = useState(false)
  const [fixStatus, setFixStatus] = useState<string | null>(null)
  const [isUsingBypass, setIsUsingBypass] = useState(false)
  const MAX_RETRIES = 3

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
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Function to manually fix database permissions
  const handleFixPermissions = async () => {
    try {
      setIsFixingPermissions(true)
      setFixStatus("Starting permission fix process...")

      // Step 1: Reset the Supabase client to ensure a clean state
      resetSupabaseClient()
      setFixStatus("Reset Supabase client...")

      // Step 2: Call the API to fix permissions
      const response = await fetch("/api/database/fix-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const data = await response.json()
        setError(`Failed to fix permissions: ${data.error || "Unknown error"}`)
        setFixStatus(null)
        setIsFixingPermissions(false)
        return
      }

      // Step 3: Reset retry count and prepare for another sign-in attempt
      setRetryCount(0)
      setIsDatabaseError(false)
      setFixStatus("Permissions fixed successfully. Please try signing in again.")

      // Wait a moment before enabling the form again
      setTimeout(() => {
        setIsFixingPermissions(false)
        setError(null)
      }, 2000)
    } catch (err) {
      logger.error("Error fixing permissions:", err)
      setError("Failed to fix permissions. Please try again later.")
      setFixStatus(null)
      setIsFixingPermissions(false)
    }
  }

  // Function to use bypass authentication
  const handleBypassAuth = async () => {
    try {
      setIsUsingBypass(true)
      setError(null)

      const { email } = getValues()

      if (!email) {
        setError("Email is required for bypass authentication")
        setIsUsingBypass(false)
        return
      }

      const result = await bypassSignIn(email)

      if (result.error) {
        setError(`Bypass authentication failed: ${result.error.message}`)
        setIsUsingBypass(false)
        return
      }

      // If successful, redirect
      router.push(redirectTo)
    } catch (err) {
      logger.error("Error in bypass authentication:", err)
      setError("Bypass authentication failed. Please try again.")
      setIsUsingBypass(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError(null)
      setIsDatabaseError(false)
      setFixStatus(null)

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
          errorMessage.includes("granting user") ||
          errorMessage.includes("permission denied") ||
          errorMessage.includes("Database permission error")
        ) {
          setIsDatabaseError(true)

          // If we haven't exceeded max retries, try to fix permissions automatically
          if (retryCount < MAX_RETRIES) {
            setRetryCount((prev) => prev + 1)
            setError(
              `Database permission issue detected. Attempting automatic fix... (${retryCount + 1}/${MAX_RETRIES})`,
            )

            // Try to fix permissions automatically
            await handleFixPermissions()

            // Wait and retry
            setTimeout(() => {
              setIsLoading(false)
              hookFormSubmit(handleSubmit)()
            }, 2000)
            return
          } else {
            setError(
              "Database permission error. Please try the 'Fix Permissions' button below or use the emergency access option.",
            )
          }
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
            disabled={isLoading || isFixingPermissions || isUsingBypass}
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
              disabled={isLoading || isFixingPermissions || isUsingBypass}
              {...register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || isFixingPermissions || isUsingBypass}
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
          </Alert>
        )}

        {fixStatus && (
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <ShieldCheck className="h-4 w-4 mr-2 text-blue-500" />
            <AlertDescription>{fixStatus}</AlertDescription>
          </Alert>
        )}

        {isDatabaseError && retryCount >= MAX_RETRIES && (
          <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <h4 className="font-medium text-amber-800 mb-2">Database Permission Issue</h4>
            <p className="text-sm text-amber-700 mb-3">
              There appears to be an issue with database permissions. This can happen when the database schema is not
              properly set up.
            </p>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={handleFixPermissions}
                disabled={isFixingPermissions || isUsingBypass}
              >
                {isFixingPermissions ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fixing Permissions...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Fix Database Permissions
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={handleBypassAuth}
                disabled={isFixingPermissions || isUsingBypass}
              >
                {isUsingBypass ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Emergency Access...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Use Emergency Access
                  </>
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-center text-amber-600">
              If the problem persists, please contact support with error code: DB-GRANT-003
            </p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || isFixingPermissions || isUsingBypass}>
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
          ) : isUsingBypass ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Emergency Access...
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
