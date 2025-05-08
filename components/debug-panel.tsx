"use client"

import { useState } from "react"
import { setDebugMode, getDebugSettings } from "@/utils/debug-utils"
import { setAuthDebugMode } from "@/context/auth-context"
import { setDebugMode as setSupabaseDebugMode } from "@/lib/supabase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { getConnectionHealth, resetSupabaseClient } from "@/lib/supabase-client"
import { enableDebugMode, disableDebugMode } from "@/lib/version"
import { isDebugMode } from "@/lib/env-utils"
import { RefreshCw, AlertCircle } from "lucide-react"
import { Link } from "next/link"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [debugSettings, setDebugSettings] = useState(getDebugSettings())
  const [connectionHealth, setConnectionHealth] = useState(getConnectionHealth())

  const toggleDebug = (namespace: keyof typeof debugSettings) => {
    const newValue = !debugSettings[namespace]
    setDebugMode(newValue, namespace as any)

    // Also update specific debug modes
    if (namespace === "auth" || namespace === "all") {
      setAuthDebugMode(newValue)
    }

    if (namespace === "supabase" || namespace === "all") {
      setSupabaseDebugMode(newValue)
    }

    // Update global debug mode
    if (namespace === "all") {
      if (newValue) {
        enableDebugMode()
      } else {
        disableDebugMode()
      }
    }

    setDebugSettings(getDebugSettings())
  }

  const refreshConnectionHealth = () => {
    setConnectionHealth(getConnectionHealth())
  }

  const resetClient = () => {
    resetSupabaseClient()
    refreshConnectionHealth()
  }

  // Only show in debug mode
  if (!isOpen && !isDebugMode()) {
    return null
  }

  if (!isOpen) {
    return (
      <Button className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white" onClick={() => setIsOpen(true)}>
        Debug
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          Debug Panel
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Debug Logging</h3>
            <div className="space-y-2">
              {Object.keys(debugSettings).map((namespace) => (
                <div key={namespace} className="flex items-center justify-between">
                  <Label htmlFor={`debug-${namespace}`}>{namespace}</Label>
                  <Switch
                    id={`debug-${namespace}`}
                    checked={debugSettings[namespace as keyof typeof debugSettings]}
                    onCheckedChange={() => toggleDebug(namespace as keyof typeof debugSettings)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Supabase Connection</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={connectionHealth.isHealthy ? "text-green-500" : "text-red-500"}>
                  {connectionHealth.isHealthy ? "Healthy" : "Unhealthy"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Initialized:</span>
                <span>{connectionHealth.isInitialized ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span>Connection Attempts:</span>
                <span>{connectionHealth.connectionAttempts}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Connection:</span>
                <span>
                  {connectionHealth.lastSuccessfulConnection
                    ? new Date(connectionHealth.lastSuccessfulConnection).toLocaleTimeString()
                    : "Never"}
                </span>
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <Button size="sm" variant="outline" onClick={refreshConnectionHealth}>
                Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={resetClient}>
                Reset Client
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Debug Links</h3>
            <div className="space-y-2">
              <Link
                href="/debug/token-refresh"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Token Refresh</span>
              </Link>
              <Link
                href="/debug/error-testing"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted"
              >
                <AlertCircle className="h-4 w-4" />
                Error Testing
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
