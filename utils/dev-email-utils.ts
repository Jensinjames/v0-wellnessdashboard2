/**
 * Development Email Utilities
 * Helpers for testing email functionality in development
 */

/**
 * Check if we're in development mode
 */
export function isDevelopmentMode(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENVIRONMENT === "development" || process.env.NODE_ENV === "development"
}

/**
 * Check if email mocking is enabled
 */
export function isEmailMockingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_EMAIL_SUCCESS === "true"
}

/**
 * Log a mock email for development purposes
 * @param emailType The type of email being mocked
 * @param to The recipient email address
 * @param redirectUrl The redirect URL (if applicable)
 */
export function logMockEmail(emailType: string, to: string, redirectUrl?: string): void {
  if (!isDevelopmentMode()) return

  console.log(`[DEV MODE] ${emailType} would be sent to ${to}`)
  if (redirectUrl) {
    console.log(`[DEV MODE] Redirect URL would be: ${redirectUrl}`)
  }

  // Additional debugging info
  console.log(`[DEV MODE] Current environment: ${process.env.NEXT_PUBLIC_APP_ENVIRONMENT}`)
  console.log(`[DEV MODE] Email mocking enabled: ${isEmailMockingEnabled()}`)
}

/**
 * Simulate an email sending process for development
 * @param to The recipient email address
 * @param emailType The type of email being sent
 * @param redirectUrl The redirect URL (if applicable)
 * @returns A promise that resolves to a success object
 */
export async function simulateEmailSending(
  to: string,
  emailType = "Password reset",
  redirectUrl?: string,
): Promise<{ success: boolean; error: null }> {
  // Only simulate in development mode with mocking enabled
  if (!isDevelopmentMode() || !isEmailMockingEnabled()) {
    throw new Error("Email simulation is only available in development mode with mocking enabled")
  }

  // Log the mock email
  logMockEmail(emailType, to, redirectUrl)

  // Simulate a network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Return success
  return { success: true, error: null }
}
