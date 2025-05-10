import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSupabaseSingleton, instanceCount } from "@/hooks/use-supabase-singleton"
import { Badge } from "@/components/ui/badge"

export function SupabaseSingletonMonitor() {
  const { supabase, instances, lastChecked, connectionStatus } = useSupabaseSingleton()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase Singleton Monitor</CardTitle>
        <CardDescription>Monitor the status of the Supabase singleton instance.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Components Using Supabase</span>
              <span className="text-xl font-bold">{instances}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Last Checked</span>
              <span className="text-sm">{lastChecked.toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-medium">Singleton Information:</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Client URL:</span>
                <code className="text-xs">{(supabase as any)?.supabaseUrl?.split("https://")[1] || "Unknown"}</code>
              </div>
              <div className="flex justify-between">
                <span>Auth Status:</span>
                <Badge variant="outline" className="ml-2">
                  {connectionStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Instance Count:</span>
                <code className="text-xs">{instanceCount || 1}</code>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
