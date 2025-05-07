import { SecureWellnessDashboard } from "@/components/dashboard/secure-wellness-dashboard"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

export default async function SecureDashboardPage() {
  // Server-side auth check
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Redirect to login if not authenticated
    redirect("/auth/sign-in?redirect=/secure-dashboard")
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Secure Wellness Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        This dashboard uses Row Level Security to ensure you only see your own data.
      </p>

      <SecureWellnessDashboard />
    </div>
  )
}
