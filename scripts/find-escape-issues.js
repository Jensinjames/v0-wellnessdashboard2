/**
 * This script scans the codebase for potential escape sequence issues
 * that might cause "Expected unicode escape" syntax errors during build.
 *
 * Usage: node scripts/find-escape-issues.js
 */

const fs = require("fs")
const path = require("path")
const { promisify } = require("util")

const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)
const readFile = promisify(fs.readFile)

// Patterns that might cause escape sequence issues
const PROBLEMATIC_PATTERNS = [
  // Incomplete unicode escapes
  { pattern: /\\u([^0-9a-fA-F]|$)/, description: "Incomplete unicode escape sequence" },

  // Incomplete hex escapes
  { pattern: /\\x([^0-9a-fA-F]|$)/, description: "Incomplete hex escape sequence" },

  // Potentially problematic backslash sequences
  { pattern: /\\([^nrtbfvu0-9x"'\\])/, description: "Potentially problematic backslash sequence" },

  // Unescaped apostrophes in JSX
  { pattern: /(\{[^}]*?)'(?:[^'\\]|\\.)*?'[^}]*?\})/, description: "Unescaped apostrophe in JSX expression" },

  // Unescaped quotes in JSX
  { pattern: /(\{[^}]*?)"(?:[^"\\]|\\.)*?"[^}]*?\})/, description: "Unescaped quote in JSX expression" },
]

// File extensions to scan
const EXTENSIONS_TO_SCAN = [".js", ".jsx", ".ts", ".tsx"]

// Directories to exclude
const EXCLUDE_DIRS = ["node_modules", ".next", "out", "build", "dist", ".git"]

async function scanDirectory(dir) {
  const issues = []

  try {
    const entries = await readdir(dir)

    for (const entry of entries) {
      const fullPath = path.join(dir, entry)

      try {
        const stats = await stat(fullPath)

        if (stats.isDirectory()) {
          // Skip excluded directories
          if (EXCLUDE_DIRS.includes(entry)) {
            continue
          }

          // Recursively scan subdirectories
          const subIssues = await scanDirectory(fullPath)
          issues.push(...subIssues)
        } else if (stats.isFile()) {
          // Check if the file has an extension we want to scan
          const ext = path.extname(fullPath)
          if (EXTENSIONS_TO_SCAN.includes(ext)) {
            const fileIssues = await scanFile(fullPath)
            issues.push(...fileIssues)
          }
        }
      } catch (err) {
        console.error(`Error processing ${fullPath}:`, err)
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err)
  }

  return issues
}

async function scanFile(filePath) {
  const issues = []

  try {
    const content = await readFile(filePath, "utf8")
    const lines = content.split("\n")

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNumber = i + 1

      for (const { pattern, description } of PROBLEMATIC_PATTERNS) {
        if (pattern.test(line)) {
          issues.push({
            file: filePath,
            line: lineNumber,
            content: line.trim(),
            description,
          })
          break // Only report one issue per line
        }
      }
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err)
  }

  return issues
}

async function main() {
  console.log("Scanning for potential escape sequence issues...")

  const startDir = process.cwd()
  const issues = await scanDirectory(startDir)

  if (issues.length === 0) {
    console.log("No issues found!")
    return
  }

  console.log(`Found ${issues.length} potential issues:`)
  console.log("-----------------------------------")

  for (const issue of issues) {
    console.log(`File: ${issue.file}`)
    console.log(`Line: ${issue.line}`)
    console.log(`Issue: ${issue.description}`)
    console.log(`Content: ${issue.content}`)
    console.log("-----------------------------------")
  }

  console.log("Suggestion: Check these files for escape sequence issues and fix them.")
}

main().catch((err) => {
  console.error("Error running script:", err)
  process.exit(1)
})
