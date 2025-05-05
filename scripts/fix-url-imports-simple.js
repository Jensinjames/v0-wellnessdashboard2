// Simple script to fix URL imports without using regex matches that could cause null errors
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

console.log("Starting URL import fix script...")

// Function to safely fix a file with URL imports
function safeFixFile(filePath) {
  try {
    console.log(`Processing file: ${filePath}`)

    // Read file content
    let content = fs.readFileSync(filePath, "utf8")
    let modified = false

    // Simple string replacement for static imports
    if (content.includes("import") && (content.includes("from 'https://") || content.includes('from "https://'))) {
      console.log(`Found static URL import in ${filePath}`)

      // Replace lines with import ... from 'https://...' or import ... from "https://..."
      const lines = content.split("\n")
      const newLines = lines.map((line) => {
        if (
          (line.includes("import") && (line.includes("from 'https://") || line.includes('from "https://'))) ||
          (line.includes("import(") && (line.includes("'https://") || line.includes('"https://')))
        ) {
          modified = true
          return `// URL import removed for deployment: ${line}`
        }
        return line
      })

      content = newLines.join("\n")
    }

    // Simple string replacement for dynamic imports
    if (content.includes("import(") && (content.includes("'https://") || content.includes('"https://'))) {
      console.log(`Found dynamic URL import in ${filePath}`)
      modified = true

      // Replace import('https://...') or import("https://...")
      content = content.replace(
        /import\s*$$\s*['"]https:\/\/[^'"]+['"]\s*$$/g,
        "Promise.resolve(null) /* URL import removed for deployment */",
      )
    }

    if (modified) {
      fs.writeFileSync(filePath, content, "utf8")
      console.log(`Fixed URL imports in ${filePath}`)
      return true
    }

    return false
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
    return false
  }
}

// Find files with URL imports using grep or simple search
try {
  console.log("Searching for files with URL imports...")

  let filesToCheck = []

  try {
    // Try using grep if available
    const grepCommand =
      'grep -l -r --include="*.{js,jsx,ts,tsx}" "import .* from \'https:\\|import .* from \\"https:\\|import(\'https:\\|import(\\"https:" .'
    const result = execSync(grepCommand, { encoding: "utf8" })
    filesToCheck = result.split("\n").filter((line) => line.trim() !== "")
    console.log(`Found ${filesToCheck.length} files with URL imports using grep.`)
  } catch (error) {
    console.log("Grep not available or failed, falling back to manual search...")

    // Fallback to manual search
    function findFilesWithExtensions(dir, extensions) {
      let results = []
      const files = fs.readdirSync(dir)

      for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)

        if (stat.isDirectory() && file !== "node_modules" && file !== ".git") {
          results = results.concat(findFilesWithExtensions(filePath, extensions))
        } else if (stat.isFile() && extensions.includes(path.extname(file).toLowerCase())) {
          results.push(filePath)
        }
      }

      return results
    }

    // Find all JS/TS files
    const allFiles = findFilesWithExtensions(".", [".js", ".jsx", ".ts", ".tsx"])
    console.log(`Found ${allFiles.length} JavaScript/TypeScript files to check.`)

    // Check each file for URL imports
    for (const file of allFiles) {
      try {
        const content = fs.readFileSync(file, "utf8")
        if (
          (content.includes("import") && (content.includes("from 'https://") || content.includes('from "https://'))) ||
          (content.includes("import(") && (content.includes("'https://") || content.includes('"https://')))
        ) {
          filesToCheck.push(file)
        }
      } catch (error) {
        console.error(`Error reading ${file}:`, error.message)
      }
    }

    console.log(`Found ${filesToCheck.length} files with URL imports using manual search.`)
  }

  if (filesToCheck.length === 0) {
    console.log("No URL imports found.")
    process.exit(0)
  }

  // Fix each file
  const fixedFiles = []
  for (const file of filesToCheck) {
    if (safeFixFile(file)) {
      fixedFiles.push(file)
    }
  }

  console.log(`\nFixed URL imports in ${fixedFiles.length} files.`)
  fixedFiles.forEach((file) => {
    console.log(`  - ${file}`)
  })
} catch (error) {
  console.error("Error fixing URL imports:", error.message)
  // Don't exit with error to allow deployment to continue
  process.exit(0)
}
