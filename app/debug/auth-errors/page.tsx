import { AuthErrorMonitor } from "@/components/debug/auth-error-monitor"

export default function AuthErrorsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Error Monitoring</h1>
      <AuthErrorMonitor />
    </div>
  )
}
