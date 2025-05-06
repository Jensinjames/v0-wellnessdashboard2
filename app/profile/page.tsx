import { ProfileForm } from "@/components/profile/profile-form"
import { RestartOnboarding } from "@/components/profile/restart-onboarding"
import { Navigation } from "@/components/navigation"

export default function ProfilePage() {
  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <ProfileForm />
          </div>
          <div>
            <RestartOnboarding />
          </div>
        </div>
      </div>
    </>
  )
}
