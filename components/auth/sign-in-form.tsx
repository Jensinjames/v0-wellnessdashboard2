"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/context/auth-context"
import { Input } from "@/components/ui/input"
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
})

type SignInFormValues = z.infer<typeof signInSchema>

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Only use auth hook on the client side
  const auth = useAuth()
  const { signIn } = auth || { signIn: null }

  // Get the redirect path from URL params or default to dashboard
  const redirectTo = searchParams?.get("redirect") || "/dashboard"

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  const onSubmit = async (values: SignInFormValues) => {
    if (!signIn) {
      setError("Authentication is not available. Please try again later.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signIn({
        email: values.email,
        password: values.password,
        persistSession: values.rememberMe,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      // Ensure profile exists by calling the API endpoint
      try {
        await fetch("/api/auth/ensure-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
      } catch (profileError) {
        console.error("Error ensuring profile exists:", profileError)
        // Continue anyway, as this is not critical for sign-in
      }

      // Redirect to the specified path
      router.push(redirectTo)

      // Force a refresh to ensure all server components update
      router.refresh()
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
      setIsLoading(false)
    }
  }

  // If not on client yet, show a simple loading state
  if (!isClient) {
    return (
      <>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Loading sign in form...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
        </CardContent>
      </>
    )
  }

  return (
    <>
      <CardHeader>
        <CardTitle id="sign-in-title">Sign in</CardTitle>
        <CardDescription id="sign-in-description">Enter your credentials to access your account</CardDescription>
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
            aria-labelledby="sign-in-title"
            aria-describedby="sign-in-description"
          >
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
                        autoComplete="current-password"
                        aria-describedby="password-error"
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
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage id="password-error" aria-live="polite" />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
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
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:underline"
                aria-label="Forgot password? Reset it here"
              >
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              aria-disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <span className="sr-only">Signing in, please wait</span>
                  <span aria-hidden="true">Signing in...</span>
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href={`/auth/sign-up${redirectTo !== "/dashboard" ? `?redirect=${redirectTo}` : ""}`}
            className="text-primary hover:underline"
            aria-label="Create a new account"
          >
            Create account
          </Link>
        </p>
      </CardFooter>
    </>
  )
}

// Add default export for dynamic import
export default SignInForm
