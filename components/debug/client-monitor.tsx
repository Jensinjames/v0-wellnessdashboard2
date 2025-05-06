"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { cleanupOrphanedClients } from "@/lib/supabase-client"

export function ClientMonitor() {
  const [clientInfo, setClientInfo] = useState<any>(null)
  const [expanded, setExpanded] = useState(false)
  const { getClientInfo } = useAuth()

  useEffect(() => {
    // Update client info every 2 seconds
    const interval = setInterval(() => {
      setClientInfo(getClientInfo())
    }, 2000)

    return () => clearInterval(interval)
  }, [getClientInfo])

  if (process.env.NODE_ENV === "production") {
    return null
  }

  if (!clientInfo) {
    return null
  }

  const handleCleanup = () => {
    cleanupOrphanedClients()
    setClientInfo(getClientInfo())
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs z-50">
      <div className="flex justify-between items-center">
        <div>GoTrueClient Instances: {clientInfo.goTrueClientCount}</div>
        <button onClick={() => setExpanded(!expanded)} className="ml-2 px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">
          {expanded ? "Hide" : "Show"}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 space-y-1">
          <div>Has Client: {clientInfo.hasClient ? "Yes" : "No"}</div>
          <div>Initializing: {clientInfo.isInitializing ? "Yes" : "No"}</div>
          <div>Instance Count: {clientInfo.clientInstanceCount}</div>
          <div>
            Init Time: {clientInfo.clientInitTime ? new Date(clientInfo.clientInitTime).toLocaleTimeString() : "N/A"}
          </div>
          <div>
            Last Reset: {clientInfo.lastResetTime ? new Date(clientInfo.lastResetTime).toLocaleTimeString() : "N/A"}
          </div>
          <div>Storage Keys: {clientInfo.storageKeys.length}</div>

          <button onClick={handleCleanup} className="mt-2 px-2 py-1 bg-red-700 rounded hover:bg-red-600 w-full">
            Cleanup Orphaned Clients
          </button>
        </div>
      )}
    </div>
  )
}
