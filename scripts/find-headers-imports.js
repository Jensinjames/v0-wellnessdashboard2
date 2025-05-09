/**
 * This script scans the codebase for imports of 'headers' from 'next/headers'
 * to help identify potential issues with middleware and server components.
 */

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Directories to exclude
const excludeDirs = ["node_modules", ".next", "out", "build", "dist", ".git"]

// File extensions to scan
const extensions = [".js", ".jsx", ".ts", ".tsx"]

// Pattern to look for
const headersImportPattern = /import\s+.*?headers.*?from\s+['"]next\/headers['"]/
const useHeadersPattern = /useHeaders\s*\(/

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8")

    // Check for headers import
    const hasHeadersImport = headersImportPattern.test(content)

    // Check for useHeaders usage
    const hasUseHeaders = useHeadersPattern.test(content)

    if (hasHeadersImport || hasUseHeaders) {
      return {
        path: filePath,
        hasHeadersImport,
        hasUseHeaders,
      }
    }

    return null
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message)
    return null
  }
}

function scanDirectory(dir) {
  const results = []

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          results.push(...scanDirectory(fullPath))
        }
      } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
        const result = scanFile(fullPath)
        if (result) {
          results.push(result)
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message)
  }

  return results
}

// Main execution
console.log("Scanning for headers imports...")
const startTime = Date.now()
const rootDir = process.cwd()
const results = scanDirectory(rootDir)

console.log(`\nScan completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`)
console.log(`Found ${results.length} files with headers imports or useHeaders usage:`)

if (results.length > 0) {
  console.log("\nFiles with headers imports:")
  results.forEach((result) => {
    console.log(`- ${result.path}`)
    if (result.hasHeadersImport) {
      console.log("  - Has import from next/headers")
    }
    if (result.hasUseHeaders) {
      console.log("  - Uses useHeaders()")
    }
  })

  console.log("\nPotential issues:")
  console.log("1. headers() can only be used in Server Components")
  console.log("2. Make sure these files are not imported in middleware.js")
  console.log('3. Check for "use client" directives in these files')
}

// Check if any of these files are imported in middleware
const middlewareFiles = ["middleware.js", "middleware.ts", "src/middleware.js", "src/middleware.ts"]
let middlewareContent = ""

for (const file of middlewareFiles) {
  if (fs.existsSync(path.join(rootDir, file))) {
    middlewareContent = fs.readFileSync(path.join(rootDir, file), "utf8")
    break
  }
}

if (middlewareContent) {
  console.log("\nChecking middleware imports...")
  const potentialIssues = []

  for (const result of results) {
    const relativePath = path.relative(rootDir, result.path).replace(/\\/g, "/")
    const importPattern = new RegExp(`import\\s+.*?from\\s+['"].*?${relativePath.replace(/\.[^/.]+$/, "")}['"]`)

    if (importPattern.test(middlewareContent)) {
      potentialIssues.push(relativePath)
    }
  }

  if (potentialIssues.length > 0) {
    console.log("\nWARNING: The following files with headers imports are imported in middleware:")
    potentialIssues.forEach((file) => console.log(`- ${file}`))
    console.log("\nThis will cause runtime errors. Please refactor your code to avoid this.")
  } else {
    console.log("No headers imports found in middleware. Good!")
  }
}

process.exit(0)
