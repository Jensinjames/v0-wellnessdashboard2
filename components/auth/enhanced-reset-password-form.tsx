"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, RefreshCw, Eye, EyeOff, Shield } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { handleAuthError } from "@/utils/auth-error-handler"
import { validatePasswordStrength } from "@/utils/auth-validation"
import { Progress } from "@/components/ui/progress"

export function EnhancedResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null)
  const [passwordScore, setPasswordScore] = useState(0)
  const router = useRouter()
  const { updatePassword } = useAuth()

  // Check password strength when password changes
  useEffect(() => {
    if (!password) {
      setPasswordStrength(null)
      setPasswordScore(0)
      return
    }

    const { score } = validatePasswordStrength(password)
    setPasswordScore(score)

    if (score < 3) setPasswordStrength("weak")
    else if (score < 5) setPasswordStrength("medium")
    else setPasswordStrength("strong")
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    // Check if password is too weak
    if (passwordStrength === "weak") {
      setError(
        "Please use a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and special characters",
      )
      setIsLoading(false)
      return
    }

    try {
      const { success, error: updateError } = await updatePassword(password)

      if (!success) {
        setError(updateError || "Failed to update password")
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/sign-in")
      }, 2000)
    } catch (err: any) {
      const errorInfo = handleAuthError(err, { operation: "password-update" })
      setError(errorInfo.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Get password strength color
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "text-red-500"
      case "medium":
        return "text-amber-500"
      case "strong":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  // Get progress bar color
  const getProgressColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "bg-red-500"
      case "medium":
        return "bg-amber-500"
      case "strong":
        return "bg-green-500"
      default:
        return "bg-gray-200"
    }
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          <AlertTitle className="font-medium">Success!</AlertTitle>
        </div>
        <AlertDescription className="mt-2">
          Your password has been reset successfully. Redirecting to sign in...
        </AlertDescription>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center justify-between">
          <span>New Password</span>
          {passwordStrength && (
            <span className={`text-xs font-medium ${getPasswordStrengthColor()}`}>
              <Shield className="h-3 w-3 inline mr-1" />
              {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
            </span>
          )}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="pr-10"
            placeholder="••••••••"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
          </Button>
        </div>
        {password && (
          <Progress value={passwordScore * 16.67} className="h-1 mt-1" indicatorClassName={getProgressColor()} />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            className={password !== confirmPassword && confirmPassword !== "" ? "border-red-500 pr-10" : "pr-10"}
            placeholder="••••••••"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
          </Button>
        </div>
        {password !== confirmPassword && confirmPassword !== "" && (
          <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Resetting Password...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  )
}
