/**
 * Utility to scan for and fix common Unicode escape sequence issues
 */
export function fixUnicodeEscapes(code: string): string {
  // Fix incomplete Unicode escapes like \u that aren't followed by 4 hex digits
  const fixedCode = code.replace(/\\u(?![0-9a-fA-F]{4})/g, "\\\\u")

  // Fix double backslashes before u that aren't Unicode escapes
  return fixedCode.replace(/\\\\u([^0-9a-fA-F])/g, "\\\\\\\\u$1")
}
