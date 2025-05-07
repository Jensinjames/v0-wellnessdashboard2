import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { createServerSupabaseClient } from "./supabase-server"

// Connection pool configuration
interface PoolConfig {
  maxSize: number
  minSize: number
  idleTimeoutMillis: number
}

// Connection pool statistics
interface PoolStats {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  waitingClients: number
  connectionCreationRate: number
  lastResetTime: number | null
}

class ConnectionPool {
  private pool: SupabaseClient<Database>[] = []
  private activeConnections: Set<SupabaseClient<Database>> = new Set()
  private config: PoolConfig
  private waitingQueue: Array<(client: SupabaseClient<Database>) => void> = []
  private lastResetTime: number | null = null
  private connectionCreationCount = 0
  private connectionCreationStartTime = Date.now()
  private isShuttingDown = false
  private maintenanceInterval: NodeJS.Timeout | null = null
  private isInitialized = false

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 10,
      minSize: config.minSize || 2,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
    }

    // Don't initialize connections at module level
    // We'll do it lazily when needed
  }

  private async initializeMinConnections(): Promise<void> {
    if (this.isInitialized) return

    console.log(`[Connection Pool] Initializing ${this.config.minSize} minimum connections`)
    const initPromises = []

    for (let i = 0; i < this.config.minSize; i++) {
      initPromises.push(this.createConnection())
    }

    await Promise.all(initPromises)
    console.log(`[Connection Pool] Initialized ${this.pool.length} connections`)

    this.isInitialized = true

    // Start maintenance routine
    this.startMaintenance()
  }

  private startMaintenance(): void {
    // Run maintenance every 60 seconds
    this.maintenanceInterval = setInterval(() => {
      this.performMaintenance()
    }, 60000)
  }

  private async performMaintenance(): Promise<void> {
    if (this.isShuttingDown) return

    console.log(
      `[Connection Pool] Running maintenance. Pool size: ${this.pool.length}, Active: ${this.activeConnections.size}`,
    )

    // Remove excess idle connections beyond minSize
    const currentTime = Date.now()
    const excessConnections = this.pool.length - this.config.minSize

    if (excessConnections > 0 && this.waitingQueue.length === 0) {
      let removed = 0

      // Keep the most recently used connections
      const sortedPool = [...this.pool].sort((a, b) => {
        const lastUsedA = (a as any)._lastUsed || 0
        const lastUsedB = (b as any)._lastUsed || 0
        return lastUsedB - lastUsedA // Most recently used first
      })

      // Remove oldest connections beyond minSize
      for (let i = this.config.minSize; i < sortedPool.length; i++) {
        const conn = sortedPool[i]
        const lastUsed = (conn as any)._lastUsed || 0

        // Only remove if it's been idle for longer than the timeout
        if (currentTime - lastUsed > this.config.idleTimeoutMillis) {
          this.pool = this.pool.filter((c) => c !== conn)
          removed++
        }
      }

      if (removed > 0) {
        console.log(`[Connection Pool] Removed ${removed} idle connections during maintenance`)
      }
    }

    // Check health of remaining connections
    const healthChecks = this.pool.map(async (conn) => {
      try {
        // Simple health check query
        const { error } = await conn.from("_health").select("count(*)", { count: "exact" }).limit(0)
        return { conn, healthy: !error }
      } catch (e) {
        return { conn, healthy: false }
      }
    })

    const results = await Promise.all(healthChecks)
    const unhealthyConnections = results.filter((r) => !r.healthy).map((r) => r.conn)

    if (unhealthyConnections.length > 0) {
      console.log(`[Connection Pool] Found ${unhealthyConnections.length} unhealthy connections to replace`)

      // Remove unhealthy connections
      this.pool = this.pool.filter((conn) => !unhealthyConnections.includes(conn))

      // Create replacements
      const replacementPromises = []
      for (let i = 0; i < unhealthyConnections.length; i++) {
        replacementPromises.push(this.createConnection())
      }

      await Promise.all(replacementPromises)
    }
  }

  private async createConnection(): Promise<SupabaseClient<Database>> {
    this.connectionCreationCount++
    const client = await createServerSupabaseClient({
      retryOnError: true,
      timeout: 15000,
    })

    // Add metadata for pool management
    ;(client as any)._poolId = `conn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    ;(client as any)._lastUsed = Date.now()

    this.pool.push(client)
    return client
  }

  public async getConnection(): Promise<SupabaseClient<Database>> {
    if (this.isShuttingDown) {
      throw new Error("Connection pool is shutting down")
    }

    // Initialize the pool if it hasn't been initialized yet
    if (!this.isInitialized) {
      await this.initializeMinConnections()
    }

    // If we have available connections in the pool, use one
    const availableConnection = this.pool.find((conn) => !this.activeConnections.has(conn))

    if (availableConnection) {
      this.activeConnections.add(availableConnection)
      ;(availableConnection as any)._lastUsed = Date.now()
      return availableConnection
    }

    // If we can create a new connection, do so
    if (this.pool.length < this.config.maxSize) {
      const newConnection = await this.createConnection()
      this.activeConnections.add(newConnection)
      return newConnection
    }

    // Otherwise, wait for a connection to become available
    console.log(`[Connection Pool] Max pool size reached (${this.config.maxSize}). Waiting for available connection.`)

    return new Promise((resolve) => {
      this.waitingQueue.push((conn) => {
        this.activeConnections.add(conn)
        ;(conn as any)._lastUsed = Date.now()
        resolve(conn)
      })
    })
  }

  public releaseConnection(client: SupabaseClient<Database>): void {
    this.activeConnections.delete(client)
    ;(client as any)._lastUsed = Date.now()

    // If there are waiting clients, give them this connection
    if (this.waitingQueue.length > 0) {
      const nextClient = this.waitingQueue.shift()
      if (nextClient) {
        nextClient(client)
      }
    }
  }

  public getStats(): PoolStats {
    const currentTime = Date.now()
    const elapsedSeconds = (currentTime - this.connectionCreationStartTime) / 1000
    const connectionCreationRate = this.connectionCreationCount / (elapsedSeconds || 1)

    return {
      totalConnections: this.pool.length,
      activeConnections: this.activeConnections.size,
      idleConnections: this.pool.length - this.activeConnections.size,
      waitingClients: this.waitingQueue.length,
      connectionCreationRate,
      lastResetTime: this.lastResetTime,
    }
  }

  public async shutdown(): Promise<void> {
    this.isShuttingDown = true

    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval)
      this.maintenanceInterval = null
    }

    // Reject any waiting clients
    while (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift()
      if (waiter) {
        try {
          waiter(this.pool[0]) // Give them a connection anyway, they'll need to handle errors
        } catch (e) {
          console.error("Error resolving waiting client during shutdown:", e)
        }
      }
    }

    this.lastResetTime = Date.now()
    this.pool = []
    this.activeConnections.clear()
    this.isInitialized = false

    console.log("[Connection Pool] Shutdown complete")
  }

  public async reset(): Promise<void> {
    await this.shutdown()
    this.isShuttingDown = false
    this.connectionCreationCount = 0
    this.connectionCreationStartTime = Date.now()
    await this.initializeMinConnections()
  }
}

// Create a singleton instance
const connectionPool = new ConnectionPool()

export default connectionPool
