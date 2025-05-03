/**
 * Enhanced utility to scan for and fix common Unicode escape sequence issues
 */
export function fixUnicodeEscapes(code: string): string {
  // Fix incomplete Unicode escapes like \u that aren't followed by 4 hex digits
  let fixedCode = code.replace(/\\u(?![0-9a-fA-F]{4})/g, "\\\\u")

  // Fix double backslashes before u that aren't Unicode escapes
  fixedCode = fixedCode.replace(/\\\\u([^0-9a-fA-F])/g, "\\\\\\\\u$1")

  // Fix invalid Unicode escapes in template literals
  fixedCode = fixedCode.replace(/`([^`]*?)\\u([^0-9a-fA-F][^`]*?)`/g, "`$1\\\\u$2`")

  // Fix invalid Unicode escapes in regular expressions
  fixedCode = fixedCode.replace(/\/([^/]*?)\\u([^0-9a-fA-F][^/]*?)\/([gimuy]*)/g, "/$1\\\\u$2/$3")

  // Fix invalid Unicode escapes in strings
  fixedCode = fixedCode.replace(/"([^"]*?)\\u([^0-9a-fA-F][^"]*?)"/g, '"$1\\\\u$2"')
  fixedCode = fixedCode.replace(/'([^']*?)\\u([^0-9a-fA-F][^']*?)'/g, "'$1\\\\u$2'")

  // Fix trailing backslashes at line ends
  fixedCode = fixedCode.replace(/\\(\s*?)$/gm, "\\\\$1")

  // Fix backslashes before line breaks in function parameters
  fixedCode = fixedCode.replace(/\(\\\s*\n\s*/g, "(\n  ")

  return fixedCode
}
