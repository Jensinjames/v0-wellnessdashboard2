#!/usr/bin/env node

/**
 * This script runs before the build to clean up any problematic files
 * that might cause issues during dependency installation.
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

console.log(`${colors.blue}🧹 Running pre-build cleanup...${colors.reset}`)

// Check for lockfile
const lockfilePath = path.join(process.cwd(), "pnpm-lock.yaml")
if (fs.existsSync(lockfilePath)) {
  console.log(`${colors.blue}📦 Found pnpm-lock.yaml, backing up...${colors.reset}`)
  fs.copyFileSync(lockfilePath, `${lockfilePath}.backup`)

  // Check if lockfile is valid
  try {
    const lockfileContent = fs.readFileSync(lockfilePath, "utf8")

    // Look for suspicious patterns in lockfile
    const suspiciousPatterns = ["https:", "http:", "git+", "github:", "file:", "link:", "workspace:"]

    const foundPatterns = suspiciousPatterns.filter((pattern) => lockfileContent.includes(pattern))

    if (foundPatterns.length > 0) {
      console.warn(`${colors.yellow}⚠️ Found suspicious patterns in pnpm-lock.yaml:${colors.reset}`)
      foundPatterns.forEach((pattern) => {
        console.warn(`  - ${pattern}`)
      })

      console.log(`${colors.blue}🔄 Removing problematic lockfile...${colors.reset}`)
      fs.unlinkSync(lockfilePath)
      console.log(`${colors.green}✅ Removed problematic lockfile${colors.reset}`)
    } else {
      console.log(`${colors.green}✅ Lockfile looks good${colors.reset}`)
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error reading lockfile:${colors.reset}`, error)
    console.log(`${colors.blue}🔄 Removing problematic lockfile...${colors.reset}`)
    fs.unlinkSync(lockfilePath)
    console.log(`${colors.green}✅ Removed problematic lockfile${colors.reset}`)
  }
} else {
  console.log(`${colors.yellow}⚠️ No pnpm-lock.yaml found${colors.reset}`)
}

// Check for node_modules
const nodeModulesPath = path.join(process.cwd(), "node_modules")
if (fs.existsSync(nodeModulesPath)) {
  console.log(`${colors.blue}📦 Found node_modules, checking for problematic packages...${colors.reset}`)

  // Check for any packages with 'https:' in their name
  try {
    const dirs = fs.readdirSync(nodeModulesPath)
    const problematicDirs = dirs.filter(
      (dir) => dir.includes("https:") || dir.includes("http:") || dir.includes("git+") || dir.includes("github:"),
    )

    if (problematicDirs.length > 0) {
      console.warn(`${colors.yellow}⚠️ Found problematic packages in node_modules:${colors.reset}`)
      problematicDirs.forEach((dir) => {
        console.warn(`  - ${dir}`)

        // Remove the problematic package
        const packagePath = path.join(nodeModulesPath, dir)
        fs.rmSync(packagePath, { recursive: true, force: true })
        console.log(`${colors.green}✅ Removed ${dir}${colors.reset}`)
      })
    } else {
      console.log(`${colors.green}✅ No problematic packages found in node_modules${colors.reset}`)
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error checking node_modules:${colors.reset}`, error)
  }
} else {
  console.log(`${colors.yellow}⚠️ No node_modules found${colors.reset}`)
}

// Create a clean .npmrc file
console.log(`${colors.blue}📝 Creating clean .npmrc file...${colors.reset}`)
const npmrcContent = `
# Use official npm registry
registry=https://registry.npmjs.org/
# Prevent peer dependency issues
strict-peer-dependencies=false
auto-install-peers=true
# Use highest resolution mode for better compatibility
resolution-mode=highest
# Increase network timeout for better reliability on CI
network-timeout=300000
# Use exact versions to prevent unexpected updates
save-exact=true
# Prevent URL-like dependencies from being treated as URLs
save-prefix=""
# Ensure node_modules is properly linked
node-linker=hoisted
# Prevent lockfile issues
lockfile-include-tarball-url=true
# Prevent unnecessary progress output
progress=false
# Prevent unnecessary logs
loglevel=error
`.trim()

fs.writeFileSync(path.join(process.cwd(), ".npmrc"), npmrcContent)
console.log(`${colors.green}✅ Created clean .npmrc file${colors.reset}`)

// Test npm registry connectivity
console.log(`${colors.blue}🔄 Testing npm registry connectivity...${colors.reset}`)
try {
  execSync("npm ping", { stdio: "pipe" })
  console.log(`${colors.green}✅ Successfully connected to npm registry${colors.reset}`)
} catch (error) {
  console.error(`${colors.red}❌ Failed to connect to npm registry:${colors.reset}`, error)
}

console.log(`${colors.green}✅ Pre-build cleanup completed${colors.reset}`)
