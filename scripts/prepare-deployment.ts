#!/usr/bin/env node

/**
 * This script prepares the project for deployment by cleaning up
 * potential issues that could cause build failures.
 */

import fs from "fs"
import path from "path"

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
}

console.log(`${colors.blue}🚀 Preparing project for deployment...${colors.reset}`)

// Check if we're running in a CI environment
const isCI = process.env.CI === "true" || process.env.VERCEL === "1"
console.log(`${colors.blue}Environment: ${isCI ? "CI/CD" : "Local"}${colors.reset}`)

// Clean node_modules if it exists and we're in CI
if (isCI && fs.existsSync(path.join(process.cwd(), "node_modules"))) {
  console.log(`${colors.yellow}Cleaning node_modules in CI environment...${colors.reset}`)
  try {
    fs.rmSync(path.join(process.cwd(), "node_modules"), { recursive: true, force: true })
    console.log(`${colors.green}✅ node_modules cleaned${colors.reset}`)
  } catch (error) {
    console.error(`${colors.red}Failed to clean node_modules:${colors.reset}`, error)
  }
}

// Clean .next if it exists
if (fs.existsSync(path.join(process.cwd(), ".next"))) {
  console.log(`${colors.yellow}Cleaning .next directory...${colors.reset}`)
  try {
    fs.rmSync(path.join(process.cwd(), ".next"), { recursive: true, force: true })
    console.log(`${colors.green}✅ .next directory cleaned${colors.reset}`)
  } catch (error) {
    console.error(`${colors.red}Failed to clean .next directory:${colors.reset}`, error)
  }
}

// Check package.json for URL-like dependencies
const packageJsonPath = path.join(process.cwd(), "package.json")
if (fs.existsSync(packageJsonPath)) {
  console.log(`${colors.blue}Checking package.json for problematic dependencies...${colors.reset}`)
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

    // Function to check for URL-like dependencies
    const checkDeps = (deps) => {
      if (!deps) return []
      return Object.entries(deps)
        .filter(([_, version]) => {
          return (
            typeof version === "string" &&
            (version.includes("://") ||
              version.includes("github:") ||
              version.includes("git+") ||
              version.includes("file:"))
          )
        })
        .map(([name, version]) => ({ name, version }))
    }

    const problematicDeps = [...checkDeps(packageJson.dependencies), ...checkDeps(packageJson.devDependencies)]

    if (problematicDeps.length > 0) {
      console.warn(`${colors.yellow}⚠️ Found potentially problematic dependencies:${colors.reset}`)
      problematicDeps.forEach(({ name, version }) => {
        console.warn(`  - ${name}: ${version}`)
      })

      if (isCI) {
        console.log(`${colors.yellow}Automatically fixing problematic dependencies in CI...${colors.reset}`)
        let modified = false

        // Simple fix: replace URL-like versions with latest
        if (packageJson.dependencies) {
          problematicDeps
            .filter(({ name }) => packageJson.dependencies[name])
            .forEach(({ name }) => {
              packageJson.dependencies[name] = "latest"
              modified = true
            })
        }

        if (packageJson.devDependencies) {
          problematicDeps
            .filter(({ name }) => packageJson.devDependencies[name])
            .forEach(({ name }) => {
              packageJson.devDependencies[name] = "latest"
              modified = true
            })
        }

        if (modified) {
          fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
          console.log(`${colors.green}✅ Fixed problematic dependencies${colors.reset}`)
        }
      }
    } else {
      console.log(`${colors.green}✅ No problematic dependencies found${colors.reset}`)
    }
  } catch (error) {
    console.error(`${colors.red}Error checking package.json:${colors.reset}`, error)
  }
}

// Ensure .npmrc exists with proper settings
const npmrcPath = path.join(process.cwd(), ".npmrc")
const npmrcContent = `
# Use official npm registry
registry=https://registry.npmjs.org/
# Prevent peer dependency issues
strict-peer-dependencies=false
auto-install-peers=true
# Use node_modules structure that's compatible with Next.js
node-linker=hoisted
# Prevent URL-like dependencies from being treated as URLs
save-prefix=""
`.trim()

console.log(`${colors.blue}Ensuring .npmrc has proper settings...${colors.reset}`)
fs.writeFileSync(npmrcPath, npmrcContent)
console.log(`${colors.green}✅ .npmrc updated${colors.reset}`)

// Update package.json scripts if needed
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
  let modified = false

  // Add prepare-deployment to prebuild if it doesn't exist
  if (!packageJson.scripts?.prebuild?.includes("prepare-deployment")) {
    packageJson.scripts = packageJson.scripts || {}
    packageJson.scripts.prebuild = "node scripts/prepare-deployment.ts"
    modified = true
  }

  if (modified) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    console.log(`${colors.green}✅ Updated package.json scripts${colors.reset}`)
  }
} catch (error) {
  console.error(`${colors.red}Error updating package.json scripts:${colors.reset}`, error)
}

console.log(`${colors.green}✅ Deployment preparation complete${colors.reset}`)
