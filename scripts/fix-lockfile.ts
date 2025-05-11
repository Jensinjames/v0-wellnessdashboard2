#!/usr/bin/env node

/**
 * This script helps diagnose and fix common pnpm lockfile issues
 * that can cause 404 errors during dependency installation.
 */

import fs from "fs"
import path from "path"
import { execSync } from "child_process"

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
}

console.log(`${colors.blue}🔍 Checking for pnpm lockfile issues...${colors.reset}`)

// Check if lockfile exists
const lockfilePath = path.join(process.cwd(), "pnpm-lock.yaml")
const packageJsonPath = path.join(process.cwd(), "package.json")

if (!fs.existsSync(packageJsonPath)) {
  console.error(`${colors.red}❌ package.json not found!${colors.reset}`)
  process.exit(1)
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

// Check for potentially problematic dependencies
const checkDependencies = (deps: Record<string, string> | undefined) => {
  if (!deps) return []

  return Object.entries(deps)
    .filter(([_, version]) => {
      // Check for potentially problematic version specifiers
      return (
        version.startsWith("http") ||
        version.includes("git") ||
        version.includes("github") ||
        version.includes("file:") ||
        version === "*" ||
        version === "latest"
      )
    })
    .map(([name, version]) => ({ name, version }))
}

const problematicDeps = [
  ...checkDependencies(packageJson.dependencies),
  ...checkDependencies(packageJson.devDependencies),
]

if (problematicDeps.length > 0) {
  console.warn(`${colors.yellow}⚠️ Found potentially problematic dependencies:${colors.reset}`)
  problematicDeps.forEach(({ name, version }) => {
    console.warn(`  - ${name}: ${version}`)
  })
  console.log(`${colors.yellow}Consider using exact versions instead of URLs or 'latest'.${colors.reset}`)
}

// Check if lockfile exists
if (!fs.existsSync(lockfilePath)) {
  console.warn(`${colors.yellow}⚠️ pnpm-lock.yaml not found. Generating a new one...${colors.reset}`)
  try {
    execSync("pnpm install --no-frozen-lockfile", { stdio: "inherit" })
    console.log(`${colors.green}✅ Generated new lockfile.${colors.reset}`)
  } catch (error) {
    console.error(`${colors.red}❌ Failed to generate lockfile:${colors.reset}`, error)
    process.exit(1)
  }
} else {
  console.log(`${colors.green}✅ pnpm-lock.yaml exists.${colors.reset}`)

  // Backup the existing lockfile
  fs.copyFileSync(lockfilePath, `${lockfilePath}.backup`)
  console.log(`${colors.blue}📦 Created backup of lockfile at pnpm-lock.yaml.backup${colors.reset}`)

  // Regenerate the lockfile
  try {
    console.log(`${colors.blue}🔄 Regenerating lockfile...${colors.reset}`)
    execSync("pnpm install --no-frozen-lockfile", { stdio: "inherit" })
    console.log(`${colors.green}✅ Lockfile regenerated successfully.${colors.reset}`)
  } catch (error) {
    console.error(`${colors.red}❌ Failed to regenerate lockfile:${colors.reset}`, error)
    // Restore the backup
    fs.copyFileSync(`${lockfilePath}.backup`, lockfilePath)
    console.log(`${colors.yellow}⚠️ Restored lockfile from backup.${colors.reset}`)
    process.exit(1)
  }
}

console.log(`${colors.green}✅ Lockfile check completed.${colors.reset}`)
console.log(`${colors.blue}💡 If you still encounter 404 errors, try:${colors.reset}`)
console.log(`  1. Running 'pnpm install --no-frozen-lockfile'`)
console.log(`  2. Checking for private or deprecated packages`)
console.log(`  3. Ensuring all package URLs are accessible`)
