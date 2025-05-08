const fs = require("fs")
const path = require("path")
const glob = require("glob")

// Find all TypeScript and JavaScript files
const files = glob.sync("**/*.{js,jsx,ts,tsx}", {
  ignore: ["node_modules/**", ".next/**", "out/**", "scripts/**"],
})

// Check each file for imports of next/headers
let foundImports = false

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8")

  // Check for direct imports
  if (content.includes('from "next/headers"') || content.includes("from 'next/headers'")) {
    console.log(`Found direct import of next/headers in ${file}`)
    foundImports = true
  }

  // Check for indirect imports via cookies
  if (
    content.includes("cookies()") ||
    content.includes('cookies from "next/headers"') ||
    content.includes("cookies from 'next/headers'")
  ) {
    console.log(`Found potential use of cookies() from next/headers in ${file}`)
    foundImports = true
  }
})

if (!foundImports) {
  console.log("No imports of next/headers found!")
} else {
  console.error("Found imports of next/headers. Please fix these before building.")
  process.exit(1)
}
