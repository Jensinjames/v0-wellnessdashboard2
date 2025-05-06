"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProfileCompletionIndicator } from "@/components/profile/profile-completion-indicator"
import { useProfileValidation, useProfileUpdateValidation } from "@/hooks/use-profile-validation"
import type { ProfileFormData } from "@/types/auth"
import { Loader2 } from "lucide-react"

export function ProfileForm() {
  const { profile, updateProfile } = useAuth()

  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    avatar_url: profile?.avatar_url || null,
  })

  const { isValid, getFieldError, markFieldAsDirty } = useProfileValidation(formData)
  const { isSubmitting, submitError, validateUpdate } = useProfileUpdateValidation()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    markFieldAsDirty(e.target.name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await validateUpdate(formData, updateProfile)

    if (result.success) {
      // Show success message or redirect
    }
  }

  return (
    <div className="space-y-6">
      <ProfileCompletionIndicator profile={profile} showDetails />

      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError.message}</AlertDescription>
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
