import { ProfileCompletionForm } from "@/components/profile/profile-completion-form"

export default function ProfileCompletionPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-center text-3xl font-bold mb-8 text-primary">Wellness Dashboard</h1>
        <ProfileCompletionForm />
      </div>
    </div>
  )
}
