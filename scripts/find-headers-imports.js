// This is a script to help identify files that import next/headers
// You can run this manually with: node scripts/find-headers-imports.js
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Run grep to find all files importing next/headers
try {
  const result = execSync('grep -r "next/headers" --include="*.ts" --include="*.tsx" .').toString()
  console.log("Files importing next/headers:")
  console.log(result)
} catch (error) {
  console.error("Error finding imports:", error.message)
}
