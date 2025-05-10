import { LogViewer } from "@/components/debug/log-viewer"

export default function LogsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Application Logs</h1>
      <LogViewer />
    </div>
  )
}
