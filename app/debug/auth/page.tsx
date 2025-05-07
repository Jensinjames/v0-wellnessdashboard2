"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokenMonitor } from "@/components/debug/token-monitor"
import { useSupabase } from "@/hooks/use-supabase"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LogOut, RefreshCw, User, Shield } from "lucide-react"

export default function AuthDebugPage() {
  const { user, signOut } = useAuth()
  const { isOnline, refreshToken } = useSupabase({ debugMode: true })
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshToken()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Authentication Debug</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> User Information
            </CardTitle>
            <CardDescription>Current authentication state</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">User ID</div>
                  <div className="text-sm text-muted-foreground">{user.id}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Last Sign In</div>
                  <div className="text-sm text-muted-foreground">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Created At</div>
                  <div className="text-sm text-muted-foreground">
                    {user.created_at ? new Date(user.created_at).toLocaleString() : "Unknown"}
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleRefresh} disabled={refreshing || !isOnline}>
                    {refreshing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh Session
                      </>
                    )}
                  </Button>
                  <Button variant="destructive" onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-4 text-muted-foreground">Not signed in</p>
                <Button asChild>
                  <a href="/auth/sign-in">Sign In</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <TokenMonitor />
      </div>

      <div className="mt-6">
        <Tabs defaultValue="token">
          <TabsList>
            <TabsTrigger value="token">Token Management</TabsTrigger>
            <TabsTrigger value="security">Security Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="token" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" /> Token Management
                </CardTitle>
                <CardDescription>Understand how token refresh works</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-muted p-4">
                  <h3 className="mb-2 font-medium">How Token Refresh Works</h3>
                  <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
                    <li>Tokens are automatically refreshed 5 minutes before they expire</li>
                    <li>If a refresh fails, the system will retry with exponential backoff</li>
                    <li>After multiple failures, you'll be prompted to sign in again</li>
                    <li>Network status is monitored to handle offline scenarios</li>
                    <li>User activity is tracked to refresh tokens after periods of inactivity</li>
                  </ul>
                </div>

                <div className="rounded-md bg-muted p-4">
                  <h3 className="mb-2 font-medium">Troubleshooting</h3>
                  <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
                    <li>If you're experiencing authentication issues, try manually refreshing your token</li>
                    <li>Check your network connection if token refreshes are failing</li>
                    <li>The "Reset Auth State" button can help resolve persistent issues</li>
                    <li>If problems persist, sign out and sign back in</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your security preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Security settings will be implemented in a future update.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
