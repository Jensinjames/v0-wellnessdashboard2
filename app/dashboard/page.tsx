import { Navigation } from "@/components/navigation"
import { WellnessDashboard } from "@/components/dashboard/wellness-dashboard"
import { ProfileReminderBanner } from "@/components/profile/profile-reminder-banner"

export default function DashboardPage() {
  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8">
        <ProfileReminderBanner />
        <WellnessDashboard />
      </div>
    </>
  )
}
