import { ProfileForm } from "@/components/profile/profile-form"
import { Navigation } from "@/components/navigation"

export default function ProfilePage() {
  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8">
        <ProfileForm />
      </div>
    </>
  )
}
