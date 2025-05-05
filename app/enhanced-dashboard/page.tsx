import { EnhancedDashboard } from "@/components/enhanced-dashboard"
import { SupabaseProvider } from "@/context/supabase-context"

export default function EnhancedDashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <SupabaseProvider>
        <EnhancedDashboard />
      </SupabaseProvider>
    </div>
  )
}
