"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "@/components/profile/profile-settings"
import { PasswordUpdate } from "@/components/profile/password-update"

export default function AccountSettingsPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Account Settings</h2>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="security">
          <PasswordUpdate />
        </TabsContent>
      </Tabs>
    </div>
  )
}
