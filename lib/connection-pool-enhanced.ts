import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

// Connection pool configuration
const POOL_CONFIG = {
  maxConnections: 10,
  minConnections: 2,
  idleTimeoutMs: 30000, // 30 seconds
  acquireTimeoutMs: 5000, // 5 seconds
  healthCheckIntervalMs: 60000, // 1 minute
}

// Connection status
type ConnectionStatus = "idle" | "busy" | "error"

// Connection object
type PooledConnection = {
  client: ReturnType<typeof createClient<Database>>
  status: ConnectionStatus
  lastUsed: number
  id: string
  createdAt: number
  usageCount: number
  errors: number
}

class EnhancedConnectionPool {
  private connections: PooledConnection[] = []
  private isInitialized = false
  private healthCheckInterval: NodeJS.Timeout | null = null
  private debug: boolean = process.env.NODE_ENV === "development"
  private metrics = {
    totalCreated: 0,
    totalAcquired: 0,
    totalReleased: 0,
    totalErrors: 0,
    acquireTime: {
      sum: 0,
      count: 0,
      max: 0,
    },
    waitTime: {
      sum: 0,
      count: 0,
      max: 0,
    },
  }

  /**
   * Initialize the connection pool
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Create minimum connections
      for (let i = 0; i < POOL_CONFIG.minConnections; i++) {
        await this.createConnection()
      }

      // Start health check interval
      this.healthCheckInterval = setInterval(() => {
        this.performHealthCheck()
      }, POOL_CONFIG.healthCheckIntervalMs)

      this.isInitialized = true

      if (this.debug) {
        console.log(`[ConnectionPool] Initialized with ${this.connections.length} connections`)
      }
    } catch (error) {
      console.error("[ConnectionPool] Failed to initialize:", error)
      throw error
    }
  }

  /**
   * Create a new connection
   */
  private async createConnection(): Promise<PooledConnection> {
    try {
      // Create a unique ID for this connection
      const id = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      // Create the Supabase client
      let client

      try {
        // Try to create a client with cookies (for authenticated requests)
        const cookieStore = cookies()
        client = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
          auth: {
            persistSession: false,
          },
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        })
      } catch (error) {
        // Fallback to creating a client without cookies (for non-request contexts)
        client = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
          auth: {
            persistSession: false,
          },
        })
      }

      // Create the connection object
      const connection: PooledConnection = {
        client,
        status: "idle",
        lastUsed: Date.now(),
        id,
        createdAt: Date.now(),
        usageCount: 0,
        errors: 0,
      }

      // Add to the pool
      this.connections.push(connection)
      this.metrics.totalCreated++

      if (this.debug) {
        console.log(`[ConnectionPool] Created new connection: ${id}`)
      }

      return connection
    } catch (error) {
      console.error("[ConnectionPool] Failed to create connection:", error)
      this.metrics.totalErrors++
      throw error
    }
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<PooledConnection> {
    // Initialize if not already done
    if (!this.isInitialized) {
      await this.initialize()
    }

    const startTime = Date.now()

    // Find an idle connection
    let connection = this.connections.find((conn) => conn.status === "idle")

    // If no idle connection is available, create a new one if below max
    if (!connection && this.connections.length < POOL_CONFIG.maxConnections) {
      connection = await this.createConnection()
    }

    // If still no connection, wait for one to become available
    if (!connection) {
      connection = await this.waitForConnection(startTime)
    }

    // Mark as busy and update metrics
    connection.status = "busy"
    connection.lastUsed = Date.now()
    connection.usageCount++

    this.metrics.totalAcquired++
    this.metrics.acquireTime.sum += Date.now() - startTime
    this.metrics.acquireTime.count++
    this.metrics.acquireTime.max = Math.max(this.metrics.acquireTime.max, Date.now() - startTime)

    if (this.debug) {
      console.log(`[ConnectionPool] Acquired connection: ${connection.id}`)
    }

    return connection
  }

  /**
   * Wait for a connection to become available
   */
  private async waitForConnection(startTime: number): Promise<PooledConnection> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timed out waiting for a connection"))
      }, POOL_CONFIG.acquireTimeoutMs)

      const checkForIdleConnection = () => {
        const connection = this.connections.find((conn) => conn.status === "idle")

        if (connection) {
          clearTimeout(timeout)

          // Update wait time metrics
          this.metrics.waitTime.sum += Date.now() - startTime
          this.metrics.waitTime.count++
          this.metrics.waitTime.max = Math.max(this.metrics.waitTime.max, Date.now() - startTime)

          resolve(connection)
        } else {
          // Check again in 100ms
          setTimeout(checkForIdleConnection, 100)
        }
      }

      checkForIdleConnection()
    })
  }

  /**
   * Release a connection back to the pool
   */
  release(connection: PooledConnection): void {
    const conn = this.connections.find((c) => c.id === connection.id)

    if (!conn) {
      console.warn(`[ConnectionPool] Attempted to release unknown connection: ${connection.id}`)
      return
    }

    conn.status = "idle"
    conn.lastUsed = Date.now()
    this.metrics.totalReleased++

    if (this.debug) {
      console.log(`[ConnectionPool] Released connection: ${connection.id}`)
    }
  }

  /**
   * Mark a connection as having an error
   */
  markError(connection: PooledConnection): void {
    const conn = this.connections.find((c) => c.id === connection.id)

    if (!conn) {
      console.warn(`[ConnectionPool] Attempted to mark error on unknown connection: ${connection.id}`)
      return
    }

    conn.errors++
    this.metrics.totalErrors++

    // If too many errors, remove and replace the connection
    if (conn.errors >= 3) {
      this.removeConnection(conn.id)
      this.createConnection().catch((error) => {
        console.error("[ConnectionPool] Failed to create replacement connection:", error)
      })
    } else {
      conn.status = "idle"
      conn.lastUsed = Date.now()
    }
  }

  /**
   * Remove a connection from the pool
   */
  private removeConnection(id: string): void {
    const index = this.connections.findIndex((conn) => conn.id === id)

    if (index !== -1) {
      this.connections.splice(index, 1)

      if (this.debug) {
        console.log(`[ConnectionPool] Removed connection: ${id}`)
      }
    }
  }

  /**
   * Perform a health check on all connections
   */
  private async performHealthCheck(): Promise<void> {
    if (this.debug) {
      console.log(`[ConnectionPool] Performing health check on ${this.connections.length} connections`)
    }

    const now = Date.now()

    // Check each connection
    for (const connection of this.connections) {
      // Skip busy connections
      if (connection.status === "busy") continue

      // Remove idle connections that have been unused for too long
      if (
        now - connection.lastUsed > POOL_CONFIG.idleTimeoutMs &&
        this.connections.length > POOL_CONFIG.minConnections
      ) {
        this.removeConnection(connection.id)
        continue
      }

      // Test the connection with a simple query
      try {
        const { error } = await connection.client.from("health_check").select("count").limit(1)

        if (error) {
          console.warn(`[ConnectionPool] Health check failed for connection ${connection.id}:`, error)
          connection.errors++

          // If too many errors, remove and replace
          if (connection.errors >= 3) {
            this.removeConnection(connection.id)
            await this.createConnection()
          }
        } else {
          // Reset error count on successful health check
          connection.errors = 0
        }
      } catch (error) {
        console.error(`[ConnectionPool] Health check error for connection ${connection.id}:`, error)
        connection.errors++
      }
    }

    // Ensure we maintain the minimum number of connections
    while (this.connections.length < POOL_CONFIG.minConnections) {
      try {
        await this.createConnection()
      } catch (error) {
        console.error("[ConnectionPool] Failed to create connection during health check:", error)
        break
      }
    }
  }

  /**
   * Get statistics about the connection pool
   */
  getStats() {
    const idleCount = this.connections.filter((conn) => conn.status === "idle").length
    const busyCount = this.connections.filter((conn) => conn.status === "busy").length
    const errorCount = this.connections.filter((conn) => conn.status === "error").length

    return {
      total: this.connections.length,
      idle: idleCount,
      busy: busyCount,
      error: errorCount,
      metrics: {
        ...this.metrics,
        avgAcquireTime:
          this.metrics.acquireTime.count > 0 ? this.metrics.acquireTime.sum / this.metrics.acquireTime.count : 0,
        avgWaitTime: this.metrics.waitTime.count > 0 ? this.metrics.waitTime.sum / this.metrics.waitTime.count : 0,
      },
      connections: this.connections.map((conn) => ({
        id: conn.id,
        status: conn.status,
        lastUsed: conn.lastUsed,
        age: Date.now() - conn.createdAt,
        usageCount: conn.usageCount,
        errors: conn.errors,
      })),
    }
  }

  /**
   * Execute a function with a connection from the pool
   */
  async withConnection<T>(fn: (client: ReturnType<typeof createClient<Database>>) => Promise<T>): Promise<T> {
    let connection: PooledConnection | null = null

    try {
      // Acquire a connection
      connection = await this.acquire()

      // Execute the function with the connection
      return await fn(connection.client)
    } catch (error) {
      // Mark connection as having an error
      if (connection) {
        this.markError(connection)
        connection = null
      }

      throw error
    } finally {
      // Release the connection back to the pool
      if (connection) {
        this.release(connection)
      }
    }
  }

  /**
   * Clean up the connection pool
   */
  cleanup(): void {
    // Clear the health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    // Reset the pool
    this.connections = []
    this.isInitialized = false

    if (this.debug) {
      console.log("[ConnectionPool] Cleaned up connection pool")
    }
  }
}

// Export a singleton instance
const enhancedConnectionPool = new EnhancedConnectionPool()
export default enhancedConnectionPool

/**
 * Execute a function with a connection from the pool
 */
export async function withPooledConnection<T>(
  fn: (client: ReturnType<typeof createClient<Database>>) => Promise<T>,
): Promise<T> {
  return enhancedConnectionPool.withConnection(fn)
}
