import { Suspense } from "react"
import { Card } from "@/components/ui/card"
import { SearchParamsProvider } from "@/components/providers/search-params-provider"
import { SupabaseHookTesterClient } from "@/components/debug/supabase-hook-tester-client"

export default function SupabaseHookTestPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Supabase Hook Test</h1>
      <p className="mb-8 text-muted-foreground">
        This page tests the useSupabase hook to ensure it's working correctly.
      </p>

      <Suspense fallback={<LoadingCard />}>
        <SearchParamsProvider>
          <SupabaseHookTesterClient />
        </SearchParamsProvider>
      </Suspense>
    </div>
  )
}

function LoadingCard() {
  return (
    <Card className="w-full max-w-3xl p-6">
      <div className="h-[200px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading Supabase Hook Tester...</div>
      </div>
    </Card>
  )
}
