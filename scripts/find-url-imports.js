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

console.log(`${colors.cyan}Scanning project for URL imports...${colors.reset}`)

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

  console.log(`${colors.yellow}Found ${lines.length} URL imports:${colors.reset}\n`)

  const fileMap = {}

  lines.forEach((line) => {
    const [filePath, content] = line.split(":", 2)
    if (!fileMap[filePath]) {
      fileMap[filePath] = []
    }
    fileMap[filePath].push(content.trim())
  })

  for (const [file, imports] of Object.entries(fileMap)) {
    console.log(`${colors.magenta}${file}:${colors.reset}`)
    imports.forEach((importLine) => {
      console.log(`  ${colors.red}${importLine}${colors.reset}`)
    })
    console.log("")
  }

  console.log(`${colors.yellow}Total files with URL imports: ${Object.keys(fileMap).length}${colors.reset}`)
  console.log(`${colors.yellow}Total URL imports found: ${lines.length}${colors.reset}`)
} catch (error) {
  if (error.status === 1) {
    console.log(`${colors.green}No URL imports found.${colors.reset}`)
  } else {
    console.error(`${colors.red}Error scanning for URL imports:${colors.reset}`, error.message)
  }
}
