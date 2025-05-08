import { SchemaStatus } from "@/components/debug/schema-status"

export default function SchemaDebugPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Database Schema Debug</h1>
      <SchemaStatus />
    </div>
  )
}
