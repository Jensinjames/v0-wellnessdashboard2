import { SecureWellnessDashboard } from "@/components/dashboard/secure-wellness-dashboard"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

export default async function SecureDashboardPage() {
  try {
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
  } catch (error) {
    // Handle errors gracefully
    console.error("Error in secure dashboard:", error)

    return (
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Configuration Error</h1>
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Unable to connect to Supabase</h2>
          <p className="text-red-600 mb-4">
            There was an error connecting to the Supabase backend. This might be due to missing environment variables.
          </p>
          <div className="bg-white p-4 rounded border border-red-200 font-mono text-sm">
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Please check your environment variables and make sure SUPABASE_URL and SUPABASE_ANON_KEY are properly set.
          </p>
        </div>
      </div>
    )
  }
}
