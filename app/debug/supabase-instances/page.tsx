import { SupabaseInstanceMonitor } from "@/components/debug/supabase-instance-monitor"

export default function SupabaseInstancesPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Supabase Instances Debug</h1>
      <SupabaseInstanceMonitor />
    </div>
  )
}
