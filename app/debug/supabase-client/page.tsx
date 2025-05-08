import { SupabaseClientMonitor } from "@/components/debug/supabase-client-monitor"

export default function SupabaseClientDebugPage() {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Supabase Client Debug</h1>
      <SupabaseClientMonitor />

      <div className="mt-8 bg-yellow-50 p-4 rounded border border-yellow-200">
        <h2 className="text-lg font-semibold mb-2">About This Page</h2>
        <p className="text-sm text-gray-700">
          This page helps you monitor and debug the Supabase client singleton pattern. You can view client metrics, test
          connections, and reset the client instance if needed.
        </p>
      </div>
    </div>
  )
}
