import type { SupabaseClient } from "@supabase/supabase-js"

// Track if heartbeat is active
let isHeartbeatActive = false
let heartbeatInterval: NodeJS.Timeout | null = null

/**
 * Start a database heartbeat to keep the connection alive
 * @param supabase The Supabase client
 * @returns A cleanup function to stop the heartbeat
 */
export function startDatabaseHeartbeat(supabase: SupabaseClient): () => void {
  if (isHeartbeatActive) {
    return () => {}
  }

  isHeartbeatActive = true

  // Perform a simple query every 5 minutes to keep the connection alive
  heartbeatInterval = setInterval(
    async () => {
      try {
        // Simple query to keep the connection alive
        await supabase.from("profiles").select("id").limit(1)
      } catch (error) {
        // Silently handle errors - we don't want to spam the console
      }
    },
    5 * 60 * 1000,
  ) // 5 minutes

  // Return a cleanup function
  return () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
    isHeartbeatActive = false
  }
}

/**
 * Check if the heartbeat is active
 */
export function isHeartbeatRunning(): boolean {
  return isHeartbeatActive
}
