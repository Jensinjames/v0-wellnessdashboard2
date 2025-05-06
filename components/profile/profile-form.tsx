"use client"

import type React from "react"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProfileCompletionIndicator } from "@/components/profile/profile-completion-indicator"
import { useProfileManager } from "@/hooks/use-profile-validation"
import { Loader2, CheckCircle2 } from "lucide-react"
import { useEffect } from "react"

export function ProfileForm() {
  const { updateProfile } = useAuth()

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

        <Button type="submit" disabled={!isValid || isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </Button>
      </form>
    </div>
  )
}
