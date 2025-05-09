"use client"

import { useEffect, useState } from "react"
import { getCurrentClient } from "@/lib/supabase-client"
import { isProduction } from "@/lib/env-utils"

export function SupabaseDebug() {
  const [clientInfo, setClientInfo] = useState({
    exists: false,
    authState: "unknown",
  })

  useEffect(() => {
    const checkClient = async () => {
      const client = getCurrentClient()

      if (client) {
        try {
          const { data } = await client.auth.getSession()
          setClientInfo({
            exists: true,
            authState: data.session ? "authenticated" : "unauthenticated",
          })
        } catch (error) {
          setClientInfo({
            exists: true,
            authState: "error",
          })
        }
      } else {
        setClientInfo({
          exists: false,
          authState: "no-client",
        })
      }
    }

    checkClient()

    const interval = setInterval(checkClient, 5000)

    return () => clearInterval(interval)
  }, [])

  // Use isProduction() instead of directly checking NODE_ENV
  if (isProduction()) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
      <div>Supabase Client: {clientInfo.exists ? "✅" : "❌"}</div>
      <div>Auth State: {clientInfo.authState}</div>
    </div>
  )
}
