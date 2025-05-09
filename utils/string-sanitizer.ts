/**
 * String Sanitizer Utility
 *
 * This utility helps identify and fix common string escape issues
 * that can cause "Expected unicode escape" syntax errors during build.
 */

/**
 * Sanitizes a string by properly escaping any problematic sequences
 * that might cause build errors.
 */
export function sanitizeString(input: string): string {
  if (!input) return input

  // Replace problematic escape sequences
  return (
    input
      // Fix incomplete unicode escapes (e.g., \u followed by non-hex)
      .replace(/\\u([^0-9a-fA-F]|$)/g, "\\\\u$1")
      // Fix incomplete hex escapes (e.g., \x followed by non-hex)
      .replace(/\\x([^0-9a-fA-F]|$)/g, "\\\\x$1")
      // Escape backslashes before non-escape sequence characters
      .replace(/\\([^nrtbfvu0-9x])/g, "\\\\$1")
  )
}

/**
 * Checks if a string contains potentially problematic escape sequences
 * that might cause build errors.
 */
export function hasProblematicEscapes(input: string): boolean {
  if (!input) return false

  // Check for incomplete unicode escapes
  if (/\\u([^0-9a-fA-F]|$)/.test(input)) return true

  // Check for incomplete hex escapes
  if (/\\x([^0-9a-fA-F]|$)/.test(input)) return true

  // Check for potentially problematic backslash sequences
  if (/\\([^nrtbfvu0-9x])/.test(input)) return true

  return false
}

/**
 * Safely formats a string for use in JSX by wrapping it in curly braces
 * if it contains apostrophes or other special characters.
 */
export function safeJsxString(input: string): JSX.Element {
  if (!input) return <>{input}</>

  // If the string contains apostrophes or quotes, wrap it in curly braces
  if (input.includes("'") || input.includes('"') || hasProblematicEscapes(input)) {
    return <>{input}</>
  }

  return <>{input}</>
}
