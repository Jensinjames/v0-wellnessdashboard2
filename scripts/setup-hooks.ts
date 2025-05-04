import { execSync } from "child_process"
import fs from "fs"
import path from "path"

// Function to run shell commands
function runCommand(command: string): void {
  try {
    execSync(command, { stdio: "inherit" })
  } catch (error) {
    console.error(`Failed to execute command: ${command}`)
    process.exit(1)
  }
}

// Install dependencies
console.log("Installing dependencies...")
runCommand(
  "npm install --save-dev husky lint-staged prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react-hooks",
)

// Initialize Husky
console.log("Initializing Husky...")
runCommand("npx husky install")

// Create .husky directory if it doesn't exist
const huskyDir = path.join(process.cwd(), ".husky")
if (!fs.existsSync(huskyDir)) {
  fs.mkdirSync(huskyDir, { recursive: true })
}

// Create pre-commit hook
console.log("Creating pre-commit hook...")
runCommand('npx husky add .husky/pre-commit "npx lint-staged"')

// Make pre-commit hook executable
const preCommitPath = path.join(huskyDir, "pre-commit")
fs.chmodSync(preCommitPath, "755")

console.log("Pre-commit hook setup complete!")
console.log("You can now commit your changes, and the syntax will be validated automatically.")
