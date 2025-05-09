import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import EnhancedDashboardContent from "@/components/dashboard/enhanced-dashboard-content"
import { DashboardSkeleton } from "@/components/ui/skeletons"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function EnhancedDashboardPage() {
  const supabase = createServerSupabaseClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/sign-in?callbackUrl=/dashboard/enhanced")
  }

  const userId = session.user.id

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Enhanced Wellness Dashboard</h1>

      <Suspense fallback={<DashboardSkeleton />}>
        <EnhancedDashboardContent userId={userId} />
      </Suspense>
    </div>
  )
}
