import { ProfileVerificationPanel } from "@/components/admin/profile-verification-panel"

export default function ProfilesAdminPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Profile Management</h1>
      <ProfileVerificationPanel />
    </div>
  )
}
