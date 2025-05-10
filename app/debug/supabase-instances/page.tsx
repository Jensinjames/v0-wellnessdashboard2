import { Suspense } from "react"
import { Card } from "@/components/ui/card"
import { SearchParamsProvider } from "@/components/providers/search-params-provider"
import { SupabaseInstanceMonitorClient } from "@/components/debug/supabase-instance-monitor-client"

export default function SupabaseInstancesPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Supabase Instances Debug</h1>

      <Suspense fallback={<LoadingCard />}>
        <SearchParamsProvider>
          <SupabaseInstanceMonitorClient />
        </SearchParamsProvider>
      </Suspense>
    </div>
  )
}

function LoadingCard() {
  return (
    <Card className="w-full max-w-3xl p-6">
      <div className="h-[200px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading Supabase instance monitor...</div>
      </div>
    </Card>
  )
}
