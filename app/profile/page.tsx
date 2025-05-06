import { ProfileForm } from "@/components/profile/profile-form"
import { Navigation } from "@/components/navigation"
import { CacheStatus } from "@/components/cache-status"
import { RequestBatcherStatus } from "@/components/request-batcher-status"

export default function ProfilePage() {
  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 space-y-6">
        <ProfileForm />
        <div className="grid gap-6 md:grid-cols-2">
          <CacheStatus />
          <RequestBatcherStatus />
        </div>
      </div>
    </>
  )
}
