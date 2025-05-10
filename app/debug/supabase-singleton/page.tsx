import { SupabaseSingletonMonitor } from "@/components/debug/supabase-singleton-monitor"

export default function SupabaseSingletonPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Singleton Debug</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <SupabaseSingletonMonitor />
        <SupabaseSingletonMonitor />
      </div>
      <div className="mt-6">
        <p className="text-sm text-muted-foreground">
          Note: Both monitors should show the same instance count, indicating they share the same Supabase client.
        </p>
      </div>
    </div>
  )
}
