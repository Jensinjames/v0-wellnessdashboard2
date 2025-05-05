const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
}

console.log(`${colors.cyan}Fixing URL imports for deployment...${colors.reset}`)

// Function to fix a file with URL imports
function fixFile(filePath) {
  console.log(`${colors.yellow}Fixing ${filePath}...${colors.reset}`)

  let content = fs.readFileSync(filePath, "utf8")
  let modified = false

  // Fix static imports
  const staticImportRegex = /import\s+(.+?)\s+from\s+(['"])https:\/\/([^'"]+)(['"])/g
  content = content.replace(staticImportRegex, (match, importClause, quote1, url, quote2) => {
    modified = true
    return `// DEPLOYMENT FIX: URL import commented out
// Original: ${match}
// If needed, use dynamic import instead:
// const ${importClause.includes(" as ") ? importClause.split(" as ")[1] : importClause} = null; // Replace with appropriate fallback`
  })

  // Fix dynamic imports
  const dynamicImportRegex = /import\s*$$\s*(['"])https:\/\/([^'"]+)(['"])\s*$$/g
  content = content.replace(dynamicImportRegex, (match, quote1, url, quote2) => {
    modified = true
    return `/* DEPLOYMENT FIX: URL import commented out
   Original: ${match}
   If needed, use try/catch with dynamic import */
   Promise.resolve(null)`
  })

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8")
    console.log(`${colors.green}Fixed URL imports in ${filePath}${colors.reset}`)
    return true
  }

  return false
}

// Use grep to find all URL imports in the project
try {
  // Find all imports from URLs
  const grepCommand =
    'grep -r --include="*.{js,jsx,ts,tsx}" "import .* from \'https:|import .* from \\"https:|import(\'https:|import(\\"https:" .'
  const result = execSync(grepCommand, { encoding: "utf8" })

  const lines = result.split("\n").filter((line) => line.trim() !== "")

  if (lines.length === 0) {
    console.log(`${colors.green}No URL imports found.${colors.reset}`)
    process.exit(0)
  }

  console.log(`${colors.yellow}Found ${lines.length} URL imports to fix.${colors.reset}\n`)

  const fileMap = {}

  lines.forEach((line) => {
    const [filePath] = line.split(":", 1)
    fileMap[filePath] = true
  })

  const fixedFiles = []

  for (const file of Object.keys(fileMap)) {
    if (fixFile(file)) {
      fixedFiles.push(file)
    }
  }

  console.log(`\n${colors.green}Fixed URL imports in ${fixedFiles.length} files:${colors.reset}`)
  fixedFiles.forEach((file) => {
    console.log(`  - ${file}`)
  })
} catch (error) {
  if (error.status === 1) {
    console.log(`${colors.green}No URL imports found.${colors.reset}`)
  } else {
    console.error(`${colors.red}Error fixing URL imports:${colors.reset}`, error.message)
    process.exit(1)
  }
}
