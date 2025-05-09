const fs = require("fs")
const path = require("path")

// Patterns that might cause "Expected unicode escape" errors - using string literals instead of regex literals
const problematicPatterns = [
  // Incomplete unicode escapes - using string representation to avoid issues
  "\\\\u[0-9a-fA-F]{0,3}(?![0-9a-fA-F])",
  // Incomplete hex escapes
  "\\\\x[0-9a-fA-F]{0,1}(?![0-9a-fA-F])",
  // Invalid escape sequences in strings
  "\\\\[^'\"\\\\bfnrt0-9xu]",
  // Potential issues with regex
  "\\\\[pP]\\{[^}]*$",
  // Unescaped line breaks in strings
  "[^\\\\]\\n[^'\"`]",
]

// File extensions to check
const extensions = [".js", ".jsx", ".ts", ".tsx"]

// Directories to exclude
const excludeDirs = ["node_modules", ".next", "dist", ".git", ".husky"]

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8")
    let hasIssues = false

    problematicPatterns.forEach((patternStr, index) => {
      // Create regex from string pattern at runtime
      const pattern = new RegExp(patternStr, "g")
      const matches = content.match(pattern)

      if (matches) {
        if (!hasIssues) {
          console.log(`\nIssues in ${filePath}:`)
          hasIssues = true
        }

        console.log(`  Pattern ${index + 1}: ${matches.length} matches`)

        // Find line numbers for each match
        const lineNumber = 1
        const lines = []
        const contentLines = content.split("\n")

        for (let i = 0; i < contentLines.length; i++) {
          const line = contentLines[i]
          if (pattern.test(line)) {
            lines.push({
              lineNumber: i + 1,
              context: line.length > 50 ? line.substring(0, 50) + "..." : line,
            })
          }
        }

        // Display up to 3 examples
        lines.slice(0, 3).forEach(({ lineNumber, context }) => {
          console.log(`    Line ${lineNumber}: ${context}`)
        })

        if (lines.length > 3) {
          console.log(`    ... and ${lines.length - 3} more`)
        }
      }
    })

    return hasIssues
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message)
    return false
  }
}

function scanDirectory(dir) {
  let issuesFound = 0

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          issuesFound += scanDirectory(fullPath)
        }
      } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
        if (scanFile(fullPath)) {
          issuesFound++
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message)
  }

  return issuesFound
}

// Main execution
console.log("Scanning for problematic escape sequences...")
const startTime = Date.now()
const rootDir = process.cwd()
const issuesFound = scanDirectory(rootDir)

console.log(`\nScan completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`)
console.log(`Found issues in ${issuesFound} files`)

if (issuesFound > 0) {
  console.log("\nTo fix these issues:")
  console.log("1. Use proper Unicode escapes: \\u0041 instead of \\u41")
  console.log("2. Use proper hex escapes: \\x41 instead of \\x4")
  console.log('3. Remove unnecessary escapes: "hello" instead of "h\\ello"')
  console.log("4. For regex patterns, use proper escapes or raw strings")
  console.log("5. Run ESLint to catch these issues: npx eslint --fix .")
}

process.exit(issuesFound > 0 ? 1 : 0)
