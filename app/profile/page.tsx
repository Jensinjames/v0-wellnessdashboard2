"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCurrentUser, getUserProfile } from "@/lib/supabase"
import { updateUserProfile, signOut } from "@/app/actions/auth-actions"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUser = await getCurrentUser()

        if (!currentUser) {
          router.push("/auth/login")
          return
        }

        setUser(currentUser)

        const userProfile = await getUserProfile(currentUser.id)
        setProfile(userProfile)
      } catch (error) {
        console.error("Error loading user data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  async function handleUpdateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setUpdating(true)
    setMessage("")

    try {
      const formData = new FormData(event.currentTarget)
      const result = await updateUserProfile(formData)

      if (result.success) {
        setMessage("Profile updated successfully!")
        // Refresh profile data
        if (user) {
          const updatedProfile = await getUserProfile(user.id)
          setProfile(updatedProfile)
        }
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
      const result = await signOut()

      if (result.success) {
        router.push("/auth/login")
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error signing out:", error)
      setMessage("An error occurred while signing out")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <div
              className={`mb-4 p-2 rounded ${message.includes("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={user?.email || ""} disabled />
              <p className="text-sm text-muted-foreground">Email cannot be changed</p>
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
              <Button type="submit" disabled={updating} data-auth-action="update-profile">
                {updating ? "Updating..." : "Update Profile"}
              </Button>

              <Button type="button" variant="outline" onClick={handleSignOut} data-auth-action="sign-out">
                Sign Out
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
