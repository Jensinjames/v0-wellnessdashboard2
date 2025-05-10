import type { Metadata } from "next"
import { AuthLogsViewer } from "@/components/debug/auth-logs-viewer"
import { AuthLogGenerator } from "@/components/debug/auth-log-generator"

export const metadata: Metadata = {
  title: "Authentication Logs",
  description: "Monitor authentication activity",
}

export default function AuthLogsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Authentication Logs</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AuthLogsViewer />
        </div>
        <div>
          <AuthLogGenerator />
        </div>
      </div>
    </div>
  )
}
