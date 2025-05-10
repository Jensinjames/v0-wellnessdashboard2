import { Suspense } from "react"
import { SupabaseHookTesterWrapper } from "@/components/debug/supabase-hook-tester-wrapper"

export default function SupabaseHookTestPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Supabase Hook Test</h1>
      <p className="mb-8 text-muted-foreground">
        This page tests the useSupabase hook to ensure it's working correctly after fixing syntax errors.
      </p>

      <Suspense fallback={<div className="p-6 text-center">Loading Supabase Hook Tester...</div>}>
        <SupabaseHookTesterWrapper />
      </Suspense>
    </div>
  )
}
