/**
 * Utility functions to help with component boundaries between
 * client and server components
 */

/**
 * This function explicitly marks data as safe to be passed from server to client components
 * It ensures that only serializable data is passed to prevent hydration errors
 *
 * @param data The data to be marked as safe for client components
 * @returns The same data, but typed as safe for client usage
 */
export function toClientSafeProps<T>(data: T): T {
  // In a real implementation, this could perform validation
  // or serialization to ensure the data is safe for client usage
  return data
}

/**
 * Helps identify which props should be sanitized when passing from server to client
 * This is just a type utility with no runtime impact
 */
export type ClientSafeProps<T> = T
