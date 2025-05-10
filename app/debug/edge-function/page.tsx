/**
 * Edge Function Debug Page
 * Page for debugging Edge Functions
 */
import { EdgeFunctionMonitor } from "@/components/debug/edge-function-monitor"

export default function EdgeFunctionDebugPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Edge Function Debugging</h1>
      <EdgeFunctionMonitor />
    </div>
  )
}
