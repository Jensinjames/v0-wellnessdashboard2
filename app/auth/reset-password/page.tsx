"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Mail, ArrowLeft } from "lucide-react"
import { resetPassword } from "@/app/actions/auth-actions"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("email", email)

      const result = await resetPassword(formData)

      if (result.error) {
        throw new Error(result.error)
      }

      setIsSubmitted(true)
      toast({
        title: "Reset link sent",
        description: "Check your email for a link to reset your password.",
      })
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error.message || "There was a problem sending the reset link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
            <CardDescription>
              {isSubmitted
                ? "Check your email for a reset link"
                : "Enter your email address and we'll send you a link to reset your password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading} authAction="reset-password">
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="mb-4">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  If you don't see it in your inbox, please check your spam folder.
                </p>
                <Button className="mt-4" variant="outline" onClick={() => setIsSubmitted(false)}>
                  Try another email
                </Button>
              </div>
            )}

            <div className="mt-4 text-center text-sm">
              <Separator className="my-4" />
              <Link
                href="/auth/login"
                className="text-sm flex items-center justify-center text-primary hover:underline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
