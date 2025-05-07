"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Navigation } from "@/components/navigation"
import { ProfileForm } from "@/components/profile/profile-form"
import { ProfileCompletionIndicator } from "@/components/profile/profile-completion-indicator"
import { ProfileReminderBanner } from "@/components/profile/profile-reminder-banner"
import { VerificationReminder } from "@/components/profile/verification-reminder"
import { BackButton } from "@/components/ui/back-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Loading...</h1>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>
          <p>Please sign in to view your profile.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <BackButton />
        </div>

        <div className="grid gap-6">
          <ProfileReminderBanner />
          <VerificationReminder />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfileForm />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfileCompletionIndicator />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
