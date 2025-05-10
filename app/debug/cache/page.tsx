import CacheMonitor from "@/components/debug/cache-monitor"

export const metadata = {
  title: "Cache Monitor",
  description: "Monitor and debug the query cache system",
}

export default function CacheMonitorPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Cache Monitor</h1>
      <p className="text-muted-foreground mb-8">
        This page allows you to monitor and debug the query cache system. You can view cache statistics, entries, and
        tags, and perform operations like invalidation and clearing.
      </p>

      <CacheMonitor />
    </div>
  )
}
