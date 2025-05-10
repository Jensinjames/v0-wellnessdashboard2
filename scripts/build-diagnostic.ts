#!/usr/bin/env node

/**
 * Build diagnostic script to help troubleshoot Vercel build issues
 * Run this locally before deploying to identify potential problems
 */

import { execSync } from "child_process"
import fs from "fs"
import path from "path"

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
}

console.log(`${colors.cyan}🔍 Running build diagnostics...${colors.reset}\n`)

// Check Node.js version
console.log(`${colors.blue}Checking Node.js version:${colors.reset}`)
const nodeVersion = process.version
console.log(`Node.js version: ${nodeVersion}`)
const nodeMajorVersion = Number.parseInt(nodeVersion.slice(1).split(".")[0], 10)

if (nodeMajorVersion < 16) {
  console.warn(`${colors.yellow}⚠️ Node.js version ${nodeVersion} is below recommended version (16+)${colors.reset}`)
} else {
  console.log(`${colors.green}✅ Node.js version is compatible${colors.reset}`)
}

// Check pnpm version
console.log(`\n${colors.blue}Checking pnpm version:${colors.reset}`)
try {
  const pnpmVersionOutput = execSync("pnpm --version").toString().trim()
  console.log(`pnpm version: ${pnpmVersionOutput}`)

  const pnpmMajorVersion = Number.parseInt(pnpmVersionOutput.split(".")[0], 10)
  if (pnpmMajorVersion < 7) {
    console.warn(`${colors.yellow}⚠️ pnpm version ${pnpmVersionOutput} is below recommended version (7+)${colors.reset}`)
  } else {
    console.log(`${colors.green}✅ pnpm version is compatible${colors.reset}`)
  }
} catch (error) {
  console.error(`${colors.red}❌ pnpm not found. Please install pnpm: npm install -g pnpm${colors.reset}`)
}

// Check package.json
console.log(`\n${colors.blue}Checking package.json:${colors.reset}`)
const packageJsonPath = path.join(process.cwd(), "package.json")

if (!fs.existsSync(packageJsonPath)) {
  console.error(`${colors.red}❌ package.json not found!${colors.reset}`)
} else {
  console.log(`${colors.green}✅ package.json exists${colors.reset}`)

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

    // Check for next.js
    if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
      console.log(`${colors.green}✅ Next.js dependency found${colors.reset}`)
    } else {
      console.warn(`${colors.yellow}⚠️ Next.js dependency not found in package.json${colors.reset}`)
    }

    // Check for build script
    if (packageJson.scripts?.build) {
      console.log(`${colors.green}✅ Build script found: "${packageJson.scripts.build}"${colors.reset}`)
    } else {
      console.warn(`${colors.yellow}⚠️ No build script found in package.json${colors.reset}`)
    }

    // Check for potentially problematic dependencies
    const checkDependencies = (deps: Record<string, string> | undefined) => {
      if (!deps) return []

      return Object.entries(deps)
        .filter(([_, version]) => {
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
    } else {
      console.log(`${colors.green}✅ No problematic dependency formats detected${colors.reset}`)
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error parsing package.json:${colors.reset}`, error)
  }
}

// Check for .npmrc
console.log(`\n${colors.blue}Checking .npmrc:${colors.reset}`)
const npmrcPath = path.join(process.cwd(), ".npmrc")

if (!fs.existsSync(npmrcPath)) {
  console.warn(
    `${colors.yellow}⚠️ .npmrc not found. Consider creating one for better dependency resolution.${colors.reset}`,
  )
} else {
  console.log(`${colors.green}✅ .npmrc exists${colors.reset}`)

  const npmrcContent = fs.readFileSync(npmrcPath, "utf8")

  if (!npmrcContent.includes("registry=")) {
    console.warn(`${colors.yellow}⚠️ No registry specified in .npmrc${colors.reset}`)
  } else {
    console.log(`${colors.green}✅ Registry configuration found in .npmrc${colors.reset}`)
  }
}

// Check for vercel.json
console.log(`\n${colors.blue}Checking vercel.json:${colors.reset}`)
const vercelJsonPath = path.join(process.cwd(), "vercel.json")

if (!fs.existsSync(vercelJsonPath)) {
  console.warn(
    `${colors.yellow}⚠️ vercel.json not found. Consider creating one for better build configuration.${colors.reset}`,
  )
} else {
  console.log(`${colors.green}✅ vercel.json exists${colors.reset}`)
}

// Test npm registry connectivity
console.log(`\n${colors.blue}Testing npm registry connectivity:${colors.reset}`)
try {
  execSync("npm ping", { stdio: "pipe" })
  console.log(`${colors.green}✅ npm registry is reachable${colors.reset}`)
} catch (error) {
  console.error(`${colors.red}❌ Cannot reach npm registry. Check your network connection.${colors.reset}`)
}

// Run a test install
console.log(`\n${colors.blue}Running test install:${colors.reset}`)
try {
  execSync("pnpm install --no-frozen-lockfile --prefer-offline", { stdio: "pipe" })
  console.log(`${colors.green}✅ Test install completed successfully${colors.reset}`)
} catch (error) {
  console.error(`${colors.red}❌ Test install failed:${colors.reset}`)
  console.error(error.toString())
}

console.log(`\n${colors.cyan}🏁 Build diagnostics completed.${colors.reset}`)
console.log(`${colors.magenta}💡 If you're still experiencing issues, try:${colors.reset}`)
console.log(`  1. Clearing pnpm cache: pnpm store prune`)
console.log(`  2. Using --no-frozen-lockfile flag during installation`)
console.log(`  3. Checking for private packages that might not be accessible in CI`)
console.log(`  4. Ensuring all environment variables are properly set`)
