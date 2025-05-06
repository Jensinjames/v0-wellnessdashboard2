"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { SignOutButton } from "@/components/sign-out-button"

export default function Profile() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [website, setWebsite] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Refs for focus management
  const fullNameInputRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const passwordErrorRef = useRef<HTMLDivElement>(null)

  // Set focus to name input on load
  useEffect(() => {
    if (fullNameInputRef.current) {
      fullNameInputRef.current.focus()
    }
  }, [])

  // Move focus to error message when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  useEffect(() => {
    if (passwordError && passwordErrorRef.current) {
      passwordErrorRef.current.focus()
    }
  }, [passwordError])

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error loading profile:", error)
          return
        }

        if (data) {
          setFullName(data.full_name || "")
          setUsername(data.username || "")
          setWebsite(data.website || "")
          setAvatarUrl(data.avatar_url || "")
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      }
    }

    loadProfile()
  }, [user, supabase])

  // Update profile
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        username,
        website,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })

        // Announce success to screen readers
        const announcement = document.createElement("div")
        announcement.setAttribute("aria-live", "assertive")
        announcement.setAttribute("role", "status")
        announcement.className = "sr-only"
        announcement.textContent = "Profile updated successfully."
        document.body.appendChild(announcement)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Update password
  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      setPasswordLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      setPasswordLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        setPasswordError(error.message)
      } else {
        setPasswordSuccess(true)
        setNewPassword("")
        setConfirmPassword("")
        toast({
          title: "Password updated",
          description: "Your password has been updated successfully.",
        })

        // Announce success to screen readers
        const announcement = document.createElement("div")
        announcement.setAttribute("aria-live", "assertive")
        announcement.setAttribute("role", "status")
        announcement.className = "sr-only"
        announcement.textContent = "Password updated successfully."
        document.body.appendChild(announcement)
      }
    } catch (err) {
      setPasswordError("An unexpected error occurred")
      console.error(err)
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!user) {
    return (
      <main id="main-content" className="container mx-auto py-10">
        <div className="text-center">
          <p>Please sign in to view your profile.</p>
          <Button onClick={() => router.push("/auth/signin")} className="mt-4" aria-label="Go to sign in page">
            Sign In
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main id="main-content" className="container mx-auto py-10">
      <div className="mb-10 flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage
            src={avatarUrl || "/placeholder.svg?height=80&width=80&query=user"}
            alt={fullName || user?.email || "User"}
          />
          <AvatarFallback aria-hidden="true">{(user?.email?.charAt(0) || "U").toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{fullName || "Your Profile"}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList aria-label="Profile sections">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile information and how others see you on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={updateProfile} className="space-y-4" aria-label="Update profile form">
                {error && (
                  <Alert variant="destructive" ref={errorRef} tabIndex={-1} role="alert" aria-live="assertive">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert
                    className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-50"
                    role="status"
                    aria-live="polite"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <AlertDescription>Profile updated successfully!</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="full-name" className="block">
                    Full Name
                  </Label>
                  <Input
                    id="full-name"
                    ref={fullNameInputRef}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    aria-invalid={error ? "true" : "false"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="block">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    aria-invalid={error ? "true" : "false"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="block">
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    aria-invalid={error ? "true" : "false"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar-url" className="block">
                    Avatar URL
                  </Label>
                  <Input
                    id="avatar-url"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    aria-invalid={error ? "true" : "false"}
                  />
                </div>
                <Button type="submit" disabled={isLoading} aria-busy={isLoading} aria-disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={updatePassword} className="space-y-4" aria-label="Update password form">
                {passwordError && (
                  <Alert
                    variant="destructive"
                    ref={passwordErrorRef}
                    tabIndex={-1}
                    role="alert"
                    aria-live="assertive"
                    id="password-error"
                  >
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}
                {passwordSuccess && (
                  <Alert
                    className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-50"
                    role="status"
                    aria-live="polite"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <AlertDescription>Password updated successfully!</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="block">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    aria-required="true"
                    aria-invalid={passwordError ? "true" : "false"}
                    aria-describedby={passwordError ? "password-error" : undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="block">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    aria-required="true"
                    aria-invalid={passwordError ? "true" : "false"}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={passwordLoading}
                  aria-busy={passwordLoading}
                  aria-disabled={passwordLoading}
                >
                  {passwordLoading ? "Updating..." : "Update password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  )
}
