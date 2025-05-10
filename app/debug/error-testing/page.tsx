import { SupabaseErrorTester } from "@/components/debug/supabase-error-tester"

export default function ErrorTestingPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Error Handling Test Suite</h1>
      <p className="mb-8 text-muted-foreground">
        This page allows you to test how the useSupabase hook handles various error scenarios. Each test simulates a
        different type of error and verifies that the hook handles it correctly.
      </p>

      <SupabaseErrorTester />
    </div>
  )
}
