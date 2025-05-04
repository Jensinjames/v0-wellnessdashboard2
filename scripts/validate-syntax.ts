#!/usr/bin/env node
import { validateDirectorySyntax, validateFileSyntax } from "../utils/syntax-validator"
import path from "path"

// Parse command line arguments
const args = process.argv.slice(2)
const helpFlag = args.includes("--help") || args.includes("-h")
const verboseFlag = args.includes("--verbose") || args.includes("-v")
const recursiveFlag = !args.includes("--no-recursive")
const fixFlag = args.includes("--fix") || args.includes("-f")

// Show help message
if (helpFlag) {
  console.log(`
Syntax Validator

Usage:
  npx ts-node scripts/validate-syntax.ts [options] [path]

Options:
  --help, -h         Show this help message
  --verbose, -v      Show detailed validation results
  --no-recursive     Don't validate files in subdirectories
  --fix, -f          Attempt to fix syntax errors

Examples:
  npx ts-node scripts/validate-syntax.ts
  npx ts-node scripts/validate-syntax.ts src
  npx ts-node scripts/validate-syntax.ts src/components --verbose
  npx ts-node scripts/validate-syntax.ts src/components/auth --no-recursive
  npx ts-node scripts/validate-syntax.ts src/components/auth --fix
  `)
  process.exit(0)
}

// Get path to validate
const pathToValidate = args.find((arg) => !arg.startsWith("-")) || "."
const absolutePath = path.resolve(process.cwd(), pathToValidate)

console.log(`Validating syntax in ${absolutePath}${recursiveFlag ? " (including subdirectories)" : ""}...`)

// Run validation
let results
if (pathToValidate.includes(".") && !pathToValidate.endsWith("/")) {
  // Validate single file
  const { valid, error } = validateFileSyntax(absolutePath)
  results = [{ file: absolutePath, valid, error }]
} else {
  // Validate directory
  results = validateDirectorySyntax(absolutePath, recursiveFlag)
}

// Process results
const validFiles = results.filter((result) => result.valid)
const invalidFiles = results.filter((result) => !result.valid)

// Display results
console.log(`\nValidation complete: ${validFiles.length} valid files, ${invalidFiles.length} invalid files`)

if (verboseFlag && validFiles.length > 0) {
  console.log("\nValid files:")
  validFiles.forEach((result) => {
    console.log(`✅ ${result.file}`)
  })
}

if (invalidFiles.length > 0) {
  console.log("\nInvalid files:")
  invalidFiles.forEach((result) => {
    console.log(`❌ ${result.file}`)
    if (verboseFlag && result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  if (fixFlag) {
    console.log("\nAttempting to fix syntax errors...")
    console.log("Running: npx eslint --fix " + invalidFiles.map((result) => result.file).join(" "))
    const { execSync } = require("child_process")
    try {
      execSync("npx eslint --fix " + invalidFiles.map((result) => result.file).join(" "), { stdio: "inherit" })
      console.log("Fix attempt complete. Please run validation again to check results.")
    } catch (error) {
      console.error("Failed to fix syntax errors:", error)
    }
  } else {
    console.log("\nTo attempt to fix these errors, run with the --fix flag")
  }

  process.exit(1)
} else {
  console.log("\nAll files have valid syntax! 🎉")
  process.exit(0)
}
