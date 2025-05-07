"use client"

import type React from "react"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProfileCompletionIndicator } from "@/components/profile/profile-completion-indicator"
import { useProfileManager } from "@/hooks/use-profile-validation"
import { VerificationBadge } from "@/components/profile/verification-badge"
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react"
import { useEffect } from "react"
import Link from "next/link"
import { useSupabaseSingleton } from "@/hooks/use-supabase-singleton"

export function ProfileForm() {
  const { updateProfile, profile } = useAuth()
  const supabase = useSupabaseSingleton()

  const {
    formData,
    handleChange,
    handleBlur,
    isValid,
    getFieldError,
    markAllFieldsAsDirty,
    isSubmitting,
    submitError,
    submitSuccess,
    validateUpdate,
    resetSubmitState,
    completionStatus,
  } = useProfileManager()

  // Reset success message after 3 seconds
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        resetSubmitState()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [submitSuccess, resetSubmitState])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as dirty to show any validation errors
    markAllFieldsAsDirty()

    if (!isValid) return

    await validateUpdate(formData, updateProfile)
  }

  return (
    <div className="space-y-6">
      <ProfileCompletionIndicator profile={formData as any} showDetails />

      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError.message}</AlertDescription>
          </Alert>
        )}

        {submitSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">Your profile has been updated successfully.</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldError("first_name") ? "border-red-500" : ""}
            disabled={isSubmitting}
          />
          {getFieldError("first_name") && <p className="text-sm text-red-500">{getFieldError("first_name")}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={getFieldError("last_name") ? "border-red-500" : ""}
            disabled={isSubmitting}
          />
          {getFieldError("last_name") && <p className="text-sm text-red-500">{getFieldError("last_name")}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Email Address</Label>
            {profile && <VerificationBadge verified={profile.email_verified || false} type="email" />}
          </div>
          <Input value={profile?.email || ""} disabled className="bg-gray-50" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Phone Number</Label>
            {profile?.phone && <VerificationBadge verified={profile.phone_verified || false} type="phone" />}
          </div>
          <Input value={profile?.phone || "Not set"} disabled className="bg-gray-50" />
        </div>

        <div className="flex flex-col gap-4 pt-2">
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </Button>

          <Button variant="outline" asChild>
            <Link href="/profile/verification">
              Manage Verification
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
