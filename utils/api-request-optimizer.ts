// Map to track in-flight requests
const inflightRequests = new Map<string, Promise<any>>()

// Request deduplication function
export async function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  options: {
    expiryMs?: number
    abortSignal?: AbortSignal
  } = {},
): Promise<T> {
  const { expiryMs = 5000, abortSignal } = options

  // Check if there's already an in-flight request with this key
  if (inflightRequests.has(key)) {
    // Return the existing promise
    return inflightRequests.get(key) as Promise<T>
  }

  // Create a new request promise
  const requestPromise = (async () => {
    try {
      // Check if we have an abort signal
      if (abortSignal?.aborted) {
        throw new Error("Request was aborted")
      }

      // Execute the request
      const result = await requestFn()

      // Return the result
      return result
    } finally {
      // Set a timeout to remove this request from the map
      setTimeout(() => {
        if (inflightRequests.get(key) === requestPromise) {
          inflightRequests.delete(key)
        }
      }, expiryMs)
    }
  })()

  // Store the promise in the map
  inflightRequests.set(key, requestPromise)

  // If we have an abort signal, remove the request when aborted
  if (abortSignal) {
    abortSignal.addEventListener("abort", () => {
      inflightRequests.delete(key)
    })
  }

  return requestPromise
}

// Function to optimize batch requests
export async function batchRequests<T>(
  requests: Array<() => Promise<T>>,
  options: {
    concurrency?: number
    abortSignal?: AbortSignal
  } = {},
): Promise<T[]> {
  const { concurrency = 3, abortSignal } = options

  // Results array
  const results: T[] = new Array(requests.length)

  // Process requests in batches
  const processBatch = async (startIndex: number): Promise<void> => {
    if (startIndex >= requests.length || abortSignal?.aborted) {
      return
    }

    // Process a batch of requests concurrently
    const batch = requests.slice(startIndex, startIndex + concurrency)
    const batchPromises = batch.map(async (requestFn, index) => {
      try {
        const result = await requestFn()
        results[startIndex + index] = result
      } catch (error) {
        console.error(`Error in batch request at index ${startIndex + index}:`, error)
        throw error
      }
    })

    // Wait for the current batch to complete
    await Promise.all(batchPromises)

    // Process the next batch
    return processBatch(startIndex + concurrency)
  }

  // Start processing
  await processBatch(0)

  return results
}

// Function to retry failed requests with exponential backoff
export async function retryWithBackoff<T>(
  requestFn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelayMs?: number
    maxDelayMs?: number
    shouldRetry?: (error: any) => boolean
  } = {},
): Promise<T> {
  const { maxRetries = 3, initialDelayMs = 500, maxDelayMs = 10000, shouldRetry = () => true } = options

  let retries = 0
  let lastError: any

  while (retries <= maxRetries) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error

      // Check if we should retry
      if (retries >= maxRetries || !shouldRetry(error)) {
        throw error
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(maxDelayMs, initialDelayMs * Math.pow(2, retries) * (0.5 + Math.random() * 0.5))

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))

      retries++
    }
  }

  throw lastError
}
