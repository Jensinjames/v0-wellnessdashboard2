import { AuthMonitor } from "@/components/debug/auth-monitor"

export default function AuthMonitorPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Monitoring</h1>
      <p className="text-muted-foreground mb-6">
        This page displays information about GoTrueClient instances and authentication state. Multiple instances can
        cause authentication issues.
      </p>

      <div className="max-w-md">
        <AuthMonitor />
      </div>
    </div>
  )
}
