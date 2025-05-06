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

export function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mockSignUp, setMockSignUp] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMockSignUp(false)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const { error, mockSignUp: isMockSignUp } = await signUp({ email, password })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (isMockSignUp) {
        setMockSignUp(true)
        // Wait a moment before redirecting to simulate the sign-up process
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
        return
      }

      router.push("/auth/verify-email")
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {mockSignUp && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            You're being signed up in demo mode due to database connectivity issues. You'll be redirected to the
            dashboard shortly.
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
          disabled={isLoading || mockSignUp}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading || mockSignUp}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading || mockSignUp}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || mockSignUp}>
        {isLoading ? "Signing up..." : mockSignUp ? "Redirecting..." : "Sign up"}
      </Button>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="text-blue-600 hover:text-blue-500">
          Sign in
        </Link>
      </div>
    </form>
  )
}
