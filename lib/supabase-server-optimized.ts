import connectionPool from "./connection-pool"
import { createServerSupabaseClient } from "./supabase-server"

// Connection health tracking for server
const lastServerConnectionAttempt = 0
const serverConnectionAttempts = 0
const SERVER_CONNECTION_BACKOFF_BASE = 1000 // ms

/**
 * Get a Supabase client from the connection pool for server operations
 * This provides better performance and reliability for high-volume operations
 */
export async function getPooledServerClient() {
  try {
    const client = await connectionPool.getConnection()

    // Return the client with a release function
    return {
      client,
      release: () => connectionPool.releaseConnection(client),
    }
  } catch (error) {
    console.error("Error getting pooled server client:", error)

    // Fallback to creating a new client directly
    const client = await createServerSupabaseClient({
      retryOnError: true,
      timeout: 15000,
    })

    return {
      client,
      release: () => {}, // No-op for non-pooled clients
    }
  }
}

/**
 * Execute a database operation using a pooled connection
 * Automatically handles connection acquisition and release
 */
export async function withPooledConnection<T>(operation: (client: any) => Promise<T>): Promise<T> {
  const { client, release } = await getPooledServerClient()

  try {
    return await operation(client)
  } finally {
    release()
  }
}

/**
 * Get connection pool statistics
 */
export function getConnectionPoolStats() {
  return connectionPool.getStats()
}

/**
 * Reset the connection pool (useful for testing or when configuration changes)
 */
export async function resetConnectionPool() {
  await connectionPool.reset()
}
