"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { useToast } from "@/hooks/use-toast"

interface UseSupabaseClientOptions {
  withErrorHandling?: boolean
  withConnectionCheck?: boolean
}

export function useSupabaseClient(options: UseSupabaseClientOptions = {}) {
  const { withErrorHandling = true, withConnectionCheck = true } = options
  const [supabase] = useState(() => createClientComponentClient<Database>())
  const [isConnected, setIsConnected] = useState(true)
  const { toast } = useToast()

  // Check connection status
  useEffect(() => {
    if (!withConnectionCheck) return

    const checkConnection = async () => {
      try {
        // Simple ping to check connection
        const { error } = await supabase.from("wellness_categories").select("count").limit(1).single()

        if (error && !error.message.includes("Results contain 0 rows")) {
          console.warn("Supabase connection check failed:", error)
          setIsConnected(false)

          if (withErrorHandling) {
            toast({
              title: "Connection issue",
              description: "There was a problem connecting to the database. Some features may be unavailable.",
              variant: "destructive",
            })
          }
        } else {
          setIsConnected(true)
        }
      } catch (err) {
        console.error("Error checking Supabase connection:", err)
        setIsConnected(false)
      }
    }

    // Check immediately
    checkConnection()

    // Then check every 30 seconds
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [supabase, toast, withConnectionCheck, withErrorHandling])

  // Helper function to execute queries with error handling
  const query = useCallback(
    async <T>(\
      queryFn: (client: SupabaseClient<Database>) => Promise<{ data: T | null; error: any }>
    ): Promise<{ data: T | null;
  error: any
}
> =>
{
  try {
    if (!isConnected) {
      return { 
            data: null, 
            error: new Error("Database connection is currently unavailable") 
          }
    }

    const result = await queryFn(supabase)

    if (result.error && withErrorHandling) {
      console.error("Supabase query error:", result.error)
      toast({
        title: "Error",
        description: result.error.message || "An error occurred while fetching data",
        variant: "destructive",
      })
    }

    return result
  } catch (err: any) {
    console.error("Error executing Supabase query:", err)

    if (withErrorHandling) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      })
    }

    return { 
          data: null, 
          error: err instanceof Error ? err : new Error(String(err))
        }
  }
}
,
    [supabase, isConnected, toast, withErrorHandling]
  )

return {
    supabase,
    isConnected,
    query
  }
}
