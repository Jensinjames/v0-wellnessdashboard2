const fs = require("fs")
const { execSync } = require("child_process")

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
}

console.log(`${colors.blue}Checking for required dependencies...${colors.reset}`)

// Check if string-replace-loader is installed
try {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
  const devDependencies = packageJson.devDependencies || {}

  if (!devDependencies["string-replace-loader"]) {
    console.log(`${colors.yellow}string-replace-loader is not in package.json. Installing...${colors.reset}`)

    try {
      execSync("npm install --save-dev string-replace-loader", { stdio: "inherit" })
      console.log(`${colors.green}Successfully installed string-replace-loader${colors.reset}`)
    } catch (error) {
      console.error(`${colors.red}Failed to install string-replace-loader:${colors.reset}`, error.message)
      process.exit(1)
    }
  } else {
    console.log(`${colors.green}string-replace-loader is already installed.${colors.reset}`)
  }
} catch (error) {
  console.error(`${colors.red}Error checking dependencies:${colors.reset}`, error.message)
  process.exit(1)
}

console.log(`${colors.green}All required dependencies are installed.${colors.reset}`)
