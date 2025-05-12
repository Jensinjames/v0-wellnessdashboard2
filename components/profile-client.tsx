"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase-client"
import { updateUserProfile } from "@/app/actions/auth-actions"
import type { User } from "@supabase/supabase-js"

interface ProfileClientProps {
  user: User
  profile: any
}

export default function ProfileClient({ user, profile }: ProfileClientProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState("")
  const formId = "profile-form"

  async function handleUpdateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setUpdating(true)
    setMessage("")

    try {
      const formData = new FormData(event.currentTarget)
      const result = await updateUserProfile(formData)

      if (result.success) {
        setMessage("Profile updated successfully!")
        router.refresh()
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage("An error occurred while updating your profile")
    } finally {
      setUpdating(false)
    }
  }

  async function handleSignOut() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
      setMessage("An error occurred while signing out")
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle id="profile-title">User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <div
              className={`mb-4 p-2 rounded ${
                message.includes("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
              }`}
              aria-live="polite"
              role="status"
            >
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4" id={formId} aria-labelledby="profile-title">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user?.email || ""}
                disabled
                aria-describedby="email-hint"
              />
              <p className="text-sm text-muted-foreground" id="email-hint">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={profile?.name || ""} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={profile?.phone || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={profile?.location || ""} />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="submit"
                disabled={updating}
                data-auth-action="update-profile"
                aria-busy={updating}
                aria-label={updating ? "Updating profile..." : "Update profile information"}
              >
                {updating ? "Updating..." : "Update Profile"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSignOut}
                data-auth-action="sign-out"
                aria-label="Sign out of your account"
              >
                Sign Out
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
