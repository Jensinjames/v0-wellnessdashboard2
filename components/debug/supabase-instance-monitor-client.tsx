"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseClient, resetSupabaseClient } from "@/utils/supabase-client"
import { useSafeSearchParams } from "@/components/providers/search-params-provider"

export function SupabaseInstanceMonitorClient() {
  const [instances, setInstances] = useState<number>(0)
  const [clientInfo, setClientInfo] = useState<any>(null)
  const searchParams = useSafeSearchParams()
  const refresh = searchParams.get("refresh") === "true"

  // Function to check Supabase instances
  const checkInstances = () => {
    // Get the current client
    const client = getSupabaseClient()

    // Update state with client info
    setClientInfo({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      authClientExists: Boolean(client.auth),
      sessionExists: Boolean((client.auth as any)?.session),
    })

    // Increment instance counter
    setInstances((prev) => prev + 1)
  }

  // Reset Supabase client
  const resetClient = () => {
    resetSupabaseClient()
    setClientInfo(null)
    setInstances(0)
  }

  // Check instances on mount or when refresh changes
  useEffect(() => {
    checkInstances()
  }, [refresh])

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Supabase Instance Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-x-4">
          <Button onClick={checkInstances} variant="outline">
            Check Instances
          </Button>
          <Button onClick={resetClient} variant="destructive">
            Reset Client
          </Button>
        </div>

        <div className="p-4 bg-gray-50 rounded-md mb-4">
          <p className="font-semibold">Instances Checked: {instances}</p>
        </div>

        {clientInfo && (
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="font-semibold mb-2">Client Info:</p>
            <pre className="text-sm overflow-auto p-2 bg-gray-100 rounded">{JSON.stringify(clientInfo, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
