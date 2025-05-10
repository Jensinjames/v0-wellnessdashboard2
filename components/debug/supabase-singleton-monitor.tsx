import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSupabaseClient } from "@/hooks/use-supabase-client"
import { Badge } from "@/components/ui/badge"

export function SupabaseSingletonMonitor() {
  const { supabase, isLoading, debugInfo } = useSupabaseClient()

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
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <span className="text-xl font-bold">
                {isLoading ? "Loading..." : supabase ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">GoTrue Clients</span>
              <span className="text-xl font-bold">{debugInfo.goTrueClientCount}</span>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-medium">Singleton Information:</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Instance Count:</span>
                <code className="text-xs">{debugInfo.instanceCount}</code>
              </div>
              <div className="flex justify-between">
                <span>Auth Status:</span>
                <Badge variant="outline" className="ml-2">
                  {supabase ? "Authenticated" : "Not Authenticated"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Last Initialized:</span>
                <code className="text-xs">
                  {debugInfo.lastInitTime ? new Date(debugInfo.lastInitTime).toLocaleTimeString() : "Never"}
                </code>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
