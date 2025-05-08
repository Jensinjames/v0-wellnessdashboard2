"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase-singleton"

// Track component instances using the hook
let hookInstances = 0

export { instanceCount } from "@/lib/supabase-singleton"

export function useSupabaseSingleton() {
  const [instances, setInstances] = useState(0)
  const [lastChecked, setLastChecked] = useState(new Date())
  const [connectionStatus, setConnectionStatus] = useState<string>("unknown")

  // Get the singleton instance
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Increment the counter when a component uses this hook
    hookInstances++
    setInstances(hookInstances)

    // Check connection status
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          setConnectionStatus("error")
        } else if (data.session) {
          setConnectionStatus("authenticated")
        } else {
          setConnectionStatus("unauthenticated")
        }
      } catch (e) {
        setConnectionStatus("error")
      }

      setLastChecked(new Date())
    }

    checkConnection()

    // Set up interval to periodically check
    const intervalId = setInterval(() => {
      setInstances(hookInstances)
      checkConnection()
    }, 5000)

    // Clean up
    return () => {
      hookInstances--
      clearInterval(intervalId)
    }
  }, [supabase])

  return {
    supabase,
    instances,
    lastChecked,
    connectionStatus,
  }
}
