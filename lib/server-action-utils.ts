import type { z } from "zod"

/**
 * Validates form data against a Zod schema
 */
export function validateFormData<T>(
  formData: FormData | Record<string, any>,
  schema: z.ZodType<T>,
): { success: true; data: T } | { success: false; fieldErrors: Record<string, string> } {
  // Get data from FormData or direct object
  const rawData = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData

  // Handle checkbox values
  Object.keys(rawData).forEach((key) => {
    if (rawData[key] === "on" || rawData[key] === "true") {
      rawData[key] = true
    } else if (rawData[key] === "off" || rawData[key] === "false") {
      rawData[key] = false
    }
  })

  // Validate the data
  const validationResult = schema.safeParse(rawData)

  if (!validationResult.success) {
    // Return field-specific errors
    const fieldErrors = validationResult.error.errors.reduce(
      (acc, error) => {
        acc[error.path[0]] = error.message
        return acc
      },
      {} as Record<string, string>,
    )

    return {
      success: false,
      fieldErrors,
    }
  }

  return {
    success: true,
    data: validationResult.data,
  }
}

/**
 * Type for the return value of server actions
 */
export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

/**
 * Wraps a server action with error handling
 */
export async function withErrorHandling<T, R>(
  fn: (data: T) => Promise<R>,
  data: T,
  errorMessage = "An unexpected error occurred",
): Promise<ActionResult<R>> {
  try {
    const result = await fn(data)
    return { success: true, data: result }
  } catch (error: any) {
    console.error(errorMessage, error)
    return {
      success: false,
      error: error.message || errorMessage,
    }
  }
}

/**
 * Revalidates multiple paths
 */
export function revalidatePaths(paths: string[]): void {
  // This is a placeholder - in a real implementation, you would
  // import revalidatePath from next/cache and call it for each path
  // paths.forEach(path => revalidatePath(path))
}
