/**
 * Generates a unique ID that's safe to use in server components
 * This is a simplified version that doesn't maintain state between renders
 * Use only when you need an ID in a server component
 */
export function generateServerSafeId(prefix = "id"): string {
  const randomPart = Math.random().toString(36).substring(2, 10)
  return `${prefix}-${randomPart}`
}
