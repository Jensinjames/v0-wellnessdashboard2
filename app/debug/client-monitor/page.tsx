"use client"

import { ClientMonitor } from "@/components/debug/client-monitor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseClient, resetSupabaseClient, getClientStats } from "@/lib/supabase-singleton"
import { useState, useEffect } from "react"

export default function ClientMonitorPage() {
  const [stats, setStats] = useState(getClientStats())
  const [refreshCount, setRefreshCount] = useState(0)

  // Function to create a new client
  const createNewClient = () => {
    getSupabaseClient({ forceNew: true })
    setStats(getClientStats())
    setRefreshCount((prev) => prev + 1)
  }

  // Function to reset the client
  const resetClient = () => {
    resetSupabaseClient()
    setStats(getClientStats())
    setRefreshCount((prev) => prev + 1)
  }

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getClientStats())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Client Monitor</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <ClientMonitor />

        <Card>
          <CardHeader>
            <CardTitle>Client Management</CardTitle>
            <CardDescription>Test client creation and cleanup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button onClick={createNewClient}>Create New Client</Button>
                <Button variant="destructive" onClick={resetClient}>
                  Reset Client
                </Button>
              </div>

              <div className="text-sm">
                <p>Refresh Count: {refreshCount}</p>
                <p>Has Global Client: {stats.hasClient ? "Yes" : "No"}</p>
                <p>GoTrueClient Count: {stats.goTrueClientCount}</p>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>Note: Creating multiple clients will trigger warnings in the console.</p>
                <p>This page is for debugging purposes only.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
