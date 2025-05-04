"use client"

import { ProfileCompletionWizard } from "@/components/profile/profile-completion-wizard"
import { ProfileProvider } from "@/context/profile-context"
import { useAuth } from "@/context/auth-context"
import { redirect } from "next/navigation"

// Prevent static prerendering of this page
export const dynamic = "force-dynamic"

export default function ProfileCompletePage() {
  const { user, isLoading } = useAuth()

  // Redirect if not authenticated
  if (!isLoading && !user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <ProfileProvider>
        <ProfileCompletionWizard />
      </ProfileProvider>
    </div>
  )
}
