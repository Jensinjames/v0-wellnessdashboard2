import { SupabaseQueryExample } from "@/components/examples/supabase-query-example"

export default function SupabaseQueryPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Supabase Query Examples</h1>
      <p className="mb-8 text-muted-foreground">
        This page demonstrates how to use the useSupabase hook to query your actual database tables.
      </p>

      <SupabaseQueryExample />
    </div>
  )
}
