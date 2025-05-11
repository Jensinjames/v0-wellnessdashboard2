import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogViewer } from "@/components/debug/log-viewer"
import { PerformanceMonitor } from "@/components/debug/performance-monitor"
import { EdgeFunctionMonitor } from "@/components/debug/edge-function-monitor"

export default function DebugDashboardPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Debug Dashboard</h1>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">Application Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="edge-functions">Edge Functions</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-6">
          <LogViewer />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceMonitor />
        </TabsContent>

        <TabsContent value="edge-functions" className="mt-6">
          <EdgeFunctionMonitor />
        </TabsContent>
      </Tabs>
    </div>
  )
}
