"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, MapPin, Shield, Bell, Key, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { updateUserProfile, signOut } from "@/app/actions/auth-actions"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  // Fetch user data from Supabase
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true)

      try {
        // Get auth user
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push("/auth/login")
          return
        }

        // Get profile data
        const { data: profile } = await supabase.from("users").select("*").eq("id", authUser.id).single()

        if (profile) {
          setUser({
            ...profile,
            joinedDate: new Date(profile.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            }),
          })
          setFormData(profile)
        } else {
          // If profile doesn't exist yet, use auth data
          setUser({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || "",
            joinedDate: new Date(authUser.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            }),
          })
          setFormData({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || "",
          })
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        toast({
          title: "Error loading profile",
          description: "There was a problem loading your profile information.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [router, supabase, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formDataObj = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataObj.append(key, value as string)
        }
      })

      const result = await updateUserProfile(formDataObj)

      if (result.error) {
        throw new Error(result.error)
      }

      setUser({
        ...user,
        ...formData,
      })
      setIsEditing(false)

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
  }

  const getInitials = (name: string) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  if (isLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <Button variant="outline" onClick={handleLogout} authAction="logout">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={user.avatar_url || "/abstract-geometric-shapes.png"} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">{user.name}</CardTitle>
            <CardDescription>Member since {user.joinedDate}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 opacity-70" />
                <span className="text-sm">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 opacity-70" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 opacity-70" />
                  <span className="text-sm">{user.location}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              className="w-full"
              authAction="edit-profile"
            >
              {isEditing ? "Cancel Editing" : "Edit Profile"}
            </Button>
          </CardFooter>
        </Card>

        {/* Main Content Area */}
        <div className="md:col-span-2">
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information here</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name || ""}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email || ""}
                            onChange={handleInputChange}
                            disabled={true} // Email can't be changed directly
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone || ""}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            name="location"
                            value={formData.location || ""}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-6">
                        <Button type="submit" disabled={isLoading} authAction="save-profile">
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security and password</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium flex items-center">
                        <Key className="h-5 w-5 mr-2" />
                        Password
                      </h3>
                      <Separator className="my-2" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Change your password regularly for better security
                      </p>
                      <Button
                        variant="outline"
                        authAction="change-password"
                        onClick={() => router.push("/auth/reset-password")}
                      >
                        Change Password
                      </Button>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Two-Factor Authentication
                      </h3>
                      <Separator className="my-2" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Add an extra layer of security to your account
                      </p>
                      <Button variant="outline" authAction="setup-2fa">
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive updates via email</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" authAction="toggle-email-notifications">
                        Enabled
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive updates on your device</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" authAction="toggle-push-notifications">
                        Disabled
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
