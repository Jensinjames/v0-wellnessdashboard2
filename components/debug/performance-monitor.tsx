"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { useSupabase } from "@/hooks/use-supabase"

export function PerformanceMonitor() {
  const { user, getClientInfo } = useAuth()
  const { supabase, isInitialized } = useSupabase({ debugMode: true })
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("auth")
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [connectionInfo, setConnectionInfo] = useState<any>(null)
  const [cacheInfo, setcacheInfo] = useState<any>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    // Check if we should show the debug panel
    const debugParam = new URLSearchParams(window.location.search).get("debug")
    if (debugParam === "performance") {
      setIsVisible(true)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const fetchDebugInfo = async () => {
      try {
        // Get auth info
        const clientInfo = getClientInfo()
        setAuthInfo({
          user: user
            ? {
                id: user.id,
                email: user.email,
                lastSignInAt: user.last_sign_in_at,
              }
            : null,
          client: clientInfo,
          sessionStatus: user ? "authenticated" : "unauthenticated",
        })

        // Get connection pool info
        if (supabase) {
          try {
            const { data } = await supabase.from("debug_info").select("*").limit(1)
            setConnectionInfo({
              status: "connected",
              lastQuery: new Date().toISOString(),
              queryResult: data ? "success" : "empty",
            })
          } catch (error) {
            setConnectionInfo({
              status: "error",
              error: error instanceof Error ? error.message : String(error),
            })
          }
        } else {
          setConnectionInfo({
            status: "not_initialized",
            initialized: isInitialized,
          })
        }

        // Get cache info
        try {
          const response = await fetch("/api/debug/cache-stats")
          if (response.ok) {
            const data = await response.json()
            setcacheInfo(data)
          } else {
            throw new Error(`Failed to fetch cache stats: ${response.status}`)
          }
        } catch (error) {
          setcacheInfo({
            error: error instanceof Error ? error.message : String(error),
          })
        }
      } catch (error) {
        console.error("Error fetching debug info:", error)
      }
    }

    fetchDebugInfo()

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetchDebugInfo()
      setRefreshCount((prev) => prev + 1)
    }, 10000)

    return () => clearInterval(interval)
  }, [isVisible, user, supabase, isInitialized, getClientInfo, refreshCount])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 shadow-lg">
      <Card>
        <CardHeader className="py-2 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Performance Monitor</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setRefreshCount((prev) => prev + 1)}
            >
              ↻
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsVisible(false)}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="auth" className="text-xs">
                Auth
              </TabsTrigger>
              <TabsTrigger value="connection" className="text-xs">
                Connection
              </TabsTrigger>
              <TabsTrigger value="cache" className="text-xs">
                Cache
              </TabsTrigger>
            </TabsList>

            <TabsContent value="auth" className="mt-2">
              {authInfo ? (
                <pre className="text-xs overflow-auto max-h-60 p-2 bg-muted rounded">
                  {JSON.stringify(authInfo, null, 2)}
                </pre>
              ) : (
                <div className="text-xs p-2">Loading auth info...</div>
              )}
            </TabsContent>

            <TabsContent value="connection" className="mt-2">
              {connectionInfo ? (
                <pre className="text-xs overflow-auto max-h-60 p-2 bg-muted rounded">
                  {JSON.stringify(connectionInfo, null, 2)}
                </pre>
              ) : (
                <div className="text-xs p-2">Loading connection info...</div>
              )}
            </TabsContent>

            <TabsContent value="cache" className="mt-2">
              {cacheInfo ? (
                <pre className="text-xs overflow-auto max-h-60 p-2 bg-muted rounded">
                  {JSON.stringify(cacheInfo, null, 2)}
                </pre>
              ) : (
                <div className="text-xs p-2">Loading cache info...</div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-2 text-xs text-right text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
