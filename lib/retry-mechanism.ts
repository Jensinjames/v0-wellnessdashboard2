/**
 * Retry Mechanism with Exponential Backoff
 * Automatically retries failed operations with increasing delays
 */
import { createLogger } from "@/utils/logger"

const logger = createLogger("RetryMechanism")

// Retry configuration
type RetryConfig = {
  maxRetries: number // Maximum number of retry attempts
  initialDelay: number // Initial delay in milliseconds
  maxDelay: number // Maximum delay in milliseconds
  backoffFactor: number // Multiplier for each subsequent retry
  jitter: boolean // Add randomness to delay
  debug: boolean // Enable debug logging
  retryableErrors?: (error: Error) => boolean // Function to determine if an error is retryable
}

// Default configuration
const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 500, // 500ms
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  jitter: true,
  debug: false,
}

// Retry statistics
type RetryStats = {
  attempts: number
  successes: number
  failures: number
  retries: number
}

/**
 * Retry Mechanism class
 * Provides methods for retrying operations with exponential backoff
 */
export class RetryMechanism {
  private config: RetryConfig
  private stats: RetryStats

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.stats = {
      attempts: 0,
      successes: 0,
      failures: 0,
      retries: 0,
    }
  }

  /**
   * Execute a function with retry
   * @param fn Function to execute
   * @param options Retry options for this specific operation
   * @returns Promise with the result
   */
  async execute<T>(
    fn: (attempt: number) => Promise<T>,
    options: Partial<RetryConfig> = {},
  ): Promise<{ data: T | null; error: Error | null; attempts: number }> {
    // Merge global config with operation-specific options
    const config = { ...this.config, ...options }
    let attempt = 0
    let lastError: Error | null = null

    this.stats.attempts++

    while (attempt <= config.maxRetries) {
      try {
        // Execute the function
        const result = await fn(attempt)

        // Success!
        if (attempt === 0) {
          this.stats.successes++
        } else {
          this.stats.retries++
        }

        if (config.debug && attempt > 0) {
          logger.debug(`Succeeded after ${attempt} retries`)
        }

        return { data: result, error: null, attempts: attempt + 1 }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        attempt++

        // Check if we should retry this error
        if (config.retryableErrors && !config.retryableErrors(lastError)) {
          if (config.debug) {
            logger.debug(`Non-retryable error: ${lastError.message}`)
          }
          break
        }

        // If we've reached max retries, break
        if (attempt > config.maxRetries) {
          break
        }

        // Calculate delay with exponential backoff
        let delay = config.initialDelay * Math.pow(config.backoffFactor, attempt - 1)

        // Apply maximum delay
        delay = Math.min(delay, config.maxDelay)

        // Add jitter if enabled (±25%)
        if (config.jitter) {
          const jitterFactor = 0.75 + Math.random() * 0.5 // 0.75 to 1.25
          delay = Math.floor(delay * jitterFactor)
        }

        if (config.debug) {
          logger.debug(`Retry ${attempt}/${config.maxRetries} after ${delay}ms: ${lastError.message}`)
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // If we get here, all retries failed
    this.stats.failures++

    if (config.debug) {
      logger.debug(`Failed after ${attempt} attempts`)
    }

    return { data: null, error: lastError, attempts: attempt }
  }

  /**
   * Get retry statistics
   */
  getStats(): RetryStats {
    return { ...this.stats }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      attempts: 0,
      successes: 0,
      failures: 0,
      retries: 0,
    }
  }

  /**
   * Determine if a Supabase error is retryable
   * @param error Error to check
   * @returns True if the error is retryable
   */
  static isSupabaseErrorRetryable(error: Error): boolean {
    const message = error.message.toLowerCase()

    // Network errors are retryable
    if (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("connection") ||
      message.includes("socket") ||
      message.includes("econnreset") ||
      message.includes("econnrefused")
    ) {
      return true
    }

    // Rate limiting errors are retryable
    if (message.includes("rate limit") || message.includes("too many requests") || message.includes("429")) {
      return true
    }

    // Server errors are retryable
    if (
      message.includes("server error") ||
      message.includes("500") ||
      message.includes("503") ||
      message.includes("504")
    ) {
      return true
    }

    // Default to not retryable for other errors
    return false
  }
}

// Create a singleton instance
let retryInstance: RetryMechanism | null = null

/**
 * Get the global retry mechanism instance
 */
export function getRetryMechanism(config?: Partial<RetryConfig>): RetryMechanism {
  if (!retryInstance) {
    retryInstance = new RetryMechanism(config)
  }
  return retryInstance
}

/**
 * Reset the retry mechanism (useful for testing)
 */
export function resetRetryMechanism(): void {
  retryInstance = null
}
