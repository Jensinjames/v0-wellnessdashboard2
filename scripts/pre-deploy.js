const { execSync } = require("child_process")

console.log("Running pre-deployment checks...")

// Run the script to check for next/headers imports
console.log("Checking for next/headers imports...")
try {
  execSync("node scripts/check-headers-imports.js", { stdio: "inherit" })
} catch (error) {
  console.error("Found next/headers imports. Please fix these before deploying.")
  process.exit(1)
}

// Run the script to purge the pages directory
console.log("Purging pages directory...")
try {
  execSync("node scripts/purge-pages-router.js", { stdio: "inherit" })
} catch (error) {
  console.error("Failed to purge pages directory:", error.message)
  process.exit(1)
}

console.log("Pre-deployment checks passed!")
