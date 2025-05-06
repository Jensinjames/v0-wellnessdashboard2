/**
 * Fetches data with retry logic for handling transient network failures
 * @param fetchFn The fetch function to execute
 * @param retries Number of retries
 * @param delay Delay between retries in ms
 * @returns Promise with the fetch result
 */
export async function fetchWithRetry<T>(fetchFn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fetchFn()
  } catch (error) {
    // Check if we should retry
    if (retries > 0) {
      console.log(`Fetch failed, retrying... (${retries} attempts left)`)

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Exponential backoff
      return fetchWithRetry(fetchFn, retries - 1, delay * 1.5)
    }

    // No more retries, throw the error
    throw error
  }
}

/**
 * Fetches data with a timeout
 * @param promise The promise to execute
 * @param timeoutMs Timeout in milliseconds
 * @returns Promise with the result or timeout error
 */
export async function fetchWithTimeout<T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> {
  let timeoutId: NodeJS.Timeout

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Request timed out"))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch (error) {
    clearTimeout(timeoutId!)
    throw error
  }
}
