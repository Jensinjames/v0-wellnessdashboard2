import { toast } from "@/hooks/use-toast"

// Error categories
export enum ErrorCategory {
  AUTH = "auth",
  DATABASE = "database",
  NETWORK = "network",
  VALIDATION = "validation",
  UNKNOWN = "unknown",
}

// Error severity levels
export enum ErrorSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

// Error context
export interface ErrorContext {
  category: ErrorCategory
  severity: ErrorSeverity
  code?: string
  source?: string
  userId?: string
  metadata?: Record<string, any>
}

// Error handler options
export interface ErrorHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
  logToService?: boolean
  rethrow?: boolean
}

/**
 * Handle errors consistently throughout the application
 * @param error The error to handle
 * @param context Additional context about the error
 * @param options Options for handling the error
 * @returns The error message
 */
export function handleError(
  error: unknown,
  context: Partial<ErrorContext> = {},
  options: ErrorHandlerOptions = { showToast: true, logToConsole: true, logToService: false, rethrow: false },
): string {
  // Extract error message
  const errorMessage = extractErrorMessage(error)

  // Create full context
  const fullContext: ErrorContext = {
    category: context.category || ErrorCategory.UNKNOWN,
    severity: context.severity || ErrorSeverity.ERROR,
    ...context,
  }

  // Log to console
  if (options.logToConsole) {
    console.error(`[${fullContext.category.toUpperCase()}] ${errorMessage}`, {
      error,
      context: fullContext,
    })
  }

  // Show toast notification
  if (options.showToast) {
    toast({
      title: getErrorTitle(fullContext.category),
      description: errorMessage,
      variant: "destructive",
    })
  }

  // Log to error tracking service
  if (options.logToService) {
    // Implement error logging service integration here
    // Example: Sentry.captureException(error, { extra: fullContext })
  }

  // Rethrow the error if needed
  if (options.rethrow) {
    if (error instanceof Error) {
      throw error
    } else {
      throw new Error(errorMessage)
    }
  }

  return errorMessage
}

/**
 * Extract a readable message from an error
 * @param error The error to extract a message from
 * @returns A readable error message
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  if (typeof error === "object" && error !== null) {
    // Handle Supabase error format
    if ("message" in error) {
      return (error as { message: string }).message
    }

    // Handle API error format
    if ("error" in error && typeof (error as { error: unknown }).error === "string") {
      return (error as { error: string }).error
    }
  }

  return "An unknown error occurred"
}

/**
 * Get a user-friendly error title based on the error category
 * @param category The error category
 * @returns A user-friendly error title
 */
function getErrorTitle(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.AUTH:
      return "Authentication Error"
    case ErrorCategory.DATABASE:
      return "Database Error"
    case ErrorCategory.NETWORK:
      return "Network Error"
    case ErrorCategory.VALIDATION:
      return "Validation Error"
    case ErrorCategory.UNKNOWN:
    default:
      return "Error"
  }
}
