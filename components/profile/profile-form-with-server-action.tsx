"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProfileCompletionIndicator } from "@/components/profile/profile-completion-indicator"
import { VerificationBadge } from "@/components/profile/verification-badge"
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { updateProfile } from "@/app/actions/profile-actions"
import type { Database } from "@/types/database"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface ProfileFormProps {
  profile: Profile
}

export function ProfileFormWithServerAction({ profile }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    bio: profile?.bio || "",
    theme: profile?.theme || "system",
    email_notifications: profile?.email_notifications || false,
  })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<string | null>(null)

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target

    // Handle checkbox inputs
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors and success messages
    setError(null)
    setFieldErrors({})
    setSuccess(null)

    // Validate inputs
    if (!formData.first_name.trim()) {
      setFieldErrors({ first_name: "First name is required" })
      return
    }

    if (!formData.last_name.trim()) {
      setFieldErrors({ last_name: "Last name is required" })
      return
    }

    startTransition(async () => {
      try {
        // Call the server action
        const result = await updateProfile(formData)

        if (!result.success) {
          // Handle field errors
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors)
          }
          // Handle general error
          setError(result.error)
          return
        }

        // Handle success
        setSuccess(result.message || "Profile updated successfully")

        // Reset success message after 3 seconds
        setTimeout(() => {
          setSuccess(null)
        }, 3000)
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred")
      }
    })
  }

  return (
    <div className="space-y-6">
      <ProfileCompletionIndicator profile={profile} showDetails />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={fieldErrors.first_name ? "border-red-500" : ""}
            disabled={isPending}
          />
          {fieldErrors.first_name && <p className="text-sm text-red-500">{fieldErrors.first_name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={fieldErrors.last_name ? "border-red-500" : ""}
            disabled={isPending}
          />
          {fieldErrors.last_name && <p className="text-sm text-red-500">{fieldErrors.last_name}</p>}
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
          <Button type="submit" disabled={isPending}>
            {isPending ? (
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
