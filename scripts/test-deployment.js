const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

// Function to run a command and return its output
function runCommand(command) {
  try {
    return execSync(command, { encoding: "utf8", stdio: "pipe" })
  } catch (error) {
    console.error(`Error running command: ${command}`)
    console.error(error.stdout || error.message)
    return null
  }
}

// Function to test if the fix works
function testFix() {
  console.log("Testing URL import fix...")

  // Run the fix script
  console.log("Running fix script...")
  runCommand("node scripts/fix-url-imports-for-vercel.js")

  // Try to install dependencies
  console.log("Testing npm install...")
  const installResult = runCommand("npm install --dry-run")

  if (installResult) {
    console.log("✅ npm install test passed!")
    return true
  } else {
    console.log("❌ npm install test failed!")
    return false
  }
}

// Main function
function main() {
  console.log("Starting deployment test...")

  const fixWorked = testFix()

  if (fixWorked) {
    console.log("✅ Deployment test passed! The fix should work on Vercel.")
  } else {
    console.log("❌ Deployment test failed! The fix may not work on Vercel.")
    console.log("Please check the logs for more information.")
  }
}

// Run the main function
main()
