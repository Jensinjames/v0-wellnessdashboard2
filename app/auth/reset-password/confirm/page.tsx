"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePassword } from "@/app/actions/auth-actions"
import { useToast } from "@/hooks/use-toast"

export default function ResetPasswordConfirmPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    const formData = new FormData(event.currentTarget)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const result = await updatePassword(formData)

      if (result.success) {
        setSuccess(true)
        toast({
          title: "Password updated",
          description: "Your password has been successfully updated.",
        })

        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      } else {
        setError(result.error || "An error occurred during password update")
        toast({
          title: "Password update failed",
          description: result.error || "Please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Update password error:", error)
      setError("An unexpected error occurred")
      toast({
        title: "Password update failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded bg-red-100 p-2 text-red-800">{error}</div>}

          {success && (
            <div className="mb-4 rounded bg-green-100 p-2 text-green-800">
              Password updated successfully! Redirecting to login...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>

            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading ? "Updating password..." : "Update password"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Button variant="link" className="p-0" onClick={() => router.push("/auth/login")}>
              Back to login
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
