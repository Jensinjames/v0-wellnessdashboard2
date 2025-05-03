import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfileForm } from "@/components/profile/profile-form"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Profile - Wellness Dashboard",
  description: "Manage your profile and account settings",
}

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardHeader title="Profile" description="Manage your profile and account settings" />

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Personal Information</h3>
          <p className="text-sm text-muted-foreground">Update your personal details and how we can reach you</p>
        </div>
        <Separator />
        <ProfileForm />
      </div>
    </div>
  )
}
