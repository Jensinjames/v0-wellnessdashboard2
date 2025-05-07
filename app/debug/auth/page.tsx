"use client"

import { useState } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { useAuth } from "@/context/auth-context"
import { TokenMonitor } from "@/components/debug/token-monitor"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, WifiOff } from "lucide-react"

export default function AuthDebugPage() {
  const { user, session } = useAuth()
  const { isInitialized, isOnline, refreshToken, getTokenStatus, resetAuthState } = useSupabase({ debugMode: true })

  const [lastAction, setLastAction] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<string | null>(null)

  // Handle refresh button click
  const handleRefresh = async () => {
    setLastAction("Manual Token Refresh")
    setActionResult("Processing...")

    try {
      const result = await refreshToken()
      setActionResult(result ? "Success" : "Failed")
    } catch (error: any) {
      setActionResult(`Error: ${error.message}`)
    }
  }

  // Handle reset button click
  const handleReset = () => {
    setLastAction("Reset Auth State")
    setActionResult("Processing...")

    try {
      resetAuthState()
      setActionResult("Success")
    } catch (error: any) {
      setActionResult(`Error: ${error.message}`)
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>

      <div className="grid gap-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Status Card */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Client Initialized:</span>
                  {isInitialized ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" /> Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <AlertCircle className="w-3 h-3 mr-1" /> Initializing
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Network Status:</span>
                  {isOnline ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" /> Online
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <WifiOff className="w-3 h-3 mr-1" /> Offline
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Authentication:</span>
                  {user ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" /> Signed In
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <AlertCircle className="w-3 h-3 mr-1" /> Signed Out
                    </Badge>
                  )}
                </div>

                {lastAction && (
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground">Last Action: {lastAction}</div>
                    <div className="font-medium">{actionResult}</div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex gap-4">
                <Button onClick={handleRefresh} variant="outline">
                  Refresh Token
                </Button>
                <Button onClick={handleReset} variant="secondary">
                  Reset Auth State
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Token Monitor */}
          <TokenMonitor />
        </div>

        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="user">
              <TabsList>
                <TabsTrigger value="user">User</TabsTrigger>
                <TabsTrigger value="session">Session</TabsTrigger>
                <TabsTrigger value="token">Token</TabsTrigger>
              </TabsList>

              <TabsContent value="user" className="p-4 bg-muted/40 rounded-md mt-2">
                {user ? (
                  <pre className="text-xs overflow-auto">{JSON.stringify(user, null, 2)}</pre>
                ) : (
                  <div className="text-muted-foreground">Not signed in</div>
                )}
              </TabsContent>

              <TabsContent value="session" className="p-4 bg-muted/40 rounded-md mt-2">
                {session ? (
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(
                      {
                        expires_at: session.expires_at,
                        expires_in: Math.floor((session.expires_at * 1000 - Date.now()) / 1000),
                        token_type: session.token_type,
                        has_refresh_token: !!session.refresh_token,
                      },
                      null,
                      2,
                    )}
                  </pre>
                ) : (
                  <div className="text-muted-foreground">No active session</div>
                )}
              </TabsContent>

              <TabsContent value="token" className="p-4 bg-muted/40 rounded-md mt-2">
                <pre className="text-xs overflow-auto">{JSON.stringify(getTokenStatus(), null, 2)}</pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
