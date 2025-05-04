"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProfile } from "@/hooks/use-profile"
import { ProfileSettings } from "@/components/profile/profile-settings"
import { UserPreferences } from "@/components/profile/user-preferences"
import { PasswordUpdate } from "@/components/profile/password-update"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileDashboard() {
  const { profile, isLoading, error } = useProfile()
  const router = useRouter()

  useEffect(() => {
    // If profile is incomplete, redirect to completion flow
    if (!isLoading && profile && !profile.isComplete) {
      router.push("/profile/complete")
    }
  }, [profile, isLoading, router])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Profile</CardTitle>
            <CardDescription>There was an error loading your profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please try refreshing the page or contact support if the issue persists.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Profile Dashboard</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your personal information and profile settings</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>Customize your app experience and notification settings</CardDescription>
            </CardHeader>
            <CardContent>
              <UserPreferences />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordUpdate />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
