/**
 * Utility functions for checking network status and handling network errors
 */

// Check if the browser is online
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true
}

// Add a listener for online/offline events
export function addNetworkStatusListener(onlineCallback: () => void, offlineCallback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {}
  }

  window.addEventListener("online", onlineCallback)
  window.addEventListener("offline", offlineCallback)

  return () => {
    window.removeEventListener("online", onlineCallback)
    window.removeEventListener("offline", offlineCallback)
  }
}

// Check if a fetch error is a network error
export function isNetworkError(error: any): boolean {
  return (
    error instanceof TypeError &&
    (error.message.includes("Failed to fetch") ||
      error.message.includes("Network request failed") ||
      error.message.includes("NetworkError"))
  )
}

// Check if a URL is reachable
export async function isUrlReachable(url: string, timeout = 5000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return true
  } catch (error) {
    console.error(`Error checking if URL ${url} is reachable:`, error)
    return false
  }
}

// Retry a function with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000,
  maxDelay = 10000,
): Promise<T> {
  let retries = 0
  let delay = initialDelay

  while (true) {
    try {
      return await fn()
    } catch (error) {
      if (retries >= maxRetries) {
        throw error
      }

      // Only retry on network errors
      if (!isNetworkError(error)) {
        throw error
      }

      retries++
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay = Math.min(delay * 2, maxDelay)
    }
  }
}
