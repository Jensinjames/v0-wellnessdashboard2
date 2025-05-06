"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mockSignIn, setMockSignIn] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMockSignIn(false)

    try {
      const { error, mockSignIn: isMockSignIn } = await signIn({ email, password })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (isMockSignIn) {
        setMockSignIn(true)
        // Wait a moment before redirecting to simulate the sign-in process
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
        return
      }

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {mockSignIn && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            You're being signed in with demo credentials. You'll be redirected to the dashboard shortly.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading || mockSignIn}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading || mockSignIn}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || mockSignIn}>
        {isLoading ? "Signing in..." : mockSignIn ? "Redirecting..." : "Sign in"}
      </Button>

      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Link href="/auth/sign-up" className="text-blue-600 hover:text-blue-500">
          Sign up
        </Link>
      </div>
    </form>
  )
}
