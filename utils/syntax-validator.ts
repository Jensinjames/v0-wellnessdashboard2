import { execSync } from "child_process"
import fs from "fs"
import path from "path"

/**
 * Validates the syntax of a JavaScript/TypeScript file
 * @param filePath Path to the file to validate
 * @returns Object with validation result and any error message
 */
export function validateFileSyntax(filePath: string): { valid: boolean; error?: string } {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: `File not found: ${filePath}` }
    }

    // Get file extension
    const ext = path.extname(filePath)

    // Only validate JavaScript/TypeScript files
    if (![".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
      return { valid: true } // Non-JS/TS files are considered valid
    }

    // Use ESLint to validate syntax
    try {
      execSync(
        `npx eslint --no-eslintrc --parser-options=ecmaVersion:latest --parser @typescript-eslint/parser ${filePath}`,
        { stdio: "pipe" },
      )
      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Validates the syntax of all JavaScript/TypeScript files in a directory
 * @param dirPath Path to the directory to validate
 * @param recursive Whether to validate files in subdirectories
 * @returns Array of objects with file paths and validation results
 */
export function validateDirectorySyntax(
  dirPath: string,
  recursive = true,
): Array<{ file: string; valid: boolean; error?: string }> {
  const results: Array<{ file: string; valid: boolean; error?: string }> = []

  try {
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      results.push({ file: dirPath, valid: false, error: `Directory not found: ${dirPath}` })
      return results
    }

    // Get all files in directory
    const files = fs.readdirSync(dirPath)

    // Validate each file
    for (const file of files) {
      const filePath = path.join(dirPath, file)
      const stats = fs.statSync(filePath)

      if (stats.isDirectory() && recursive) {
        // Recursively validate files in subdirectory
        results.push(...validateDirectorySyntax(filePath, recursive))
      } else if (stats.isFile()) {
        // Validate file
        const { valid, error } = validateFileSyntax(filePath)
        results.push({ file: filePath, valid, error })
      }
    }

    return results
  } catch (error) {
    results.push({
      file: dirPath,
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    })
    return results
  }
}
