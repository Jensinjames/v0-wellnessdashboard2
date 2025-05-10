#!/usr/bin/env node

/**
 * This script thoroughly analyzes package.json for problematic dependencies
 * that could cause 404 errors during installation.
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
  magenta: "\x1b[35m",
}

console.log(`${colors.blue}🔍 Running comprehensive dependency diagnosis...${colors.reset}`)

// Check if package.json exists
const packageJsonPath = path.join(process.cwd(), "package.json")
if (!fs.existsSync(packageJsonPath)) {
  console.error(`${colors.red}❌ package.json not found!${colors.reset}`)
  process.exit(1)
}

// Read package.json
let packageJson
try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
  console.log(`${colors.green}✅ Successfully read package.json${colors.reset}`)
} catch (error) {
  console.error(`${colors.red}❌ Error parsing package.json:${colors.reset}`, error)
  process.exit(1)
}

// Function to check for problematic dependencies
const checkDependencies = (deps: Record<string, string> | undefined, type: string) => {
  if (!deps) return []

  const issues: Array<{ name: string; version: string; reason: string }> = []

  Object.entries(deps).forEach(([name, version]) => {
    // Check for URL-like dependencies
    if (version.startsWith("http:") || version.startsWith("https:")) {
      issues.push({
        name,
        version,
        reason: "URL-like dependency",
      })
    }

    // Check for git dependencies
    if (version.includes("git") || version.includes("github")) {
      issues.push({
        name,
        version,
        reason: "Git dependency",
      })
    }

    // Check for file dependencies
    if (version.startsWith("file:")) {
      issues.push({
        name,
        version,
        reason: "File dependency",
      })
    }

    // Check for workspace dependencies
    if (version.startsWith("workspace:")) {
      issues.push({
        name,
        version,
        reason: "Workspace dependency",
      })
    }

    // Check for non-specific versions
    if (version === "*" || version === "latest") {
      issues.push({
        name,
        version,
        reason: "Non-specific version",
      })
    }

    // Check for invalid characters
    if (/[^\w\d@\-.^~>=<|*\s]/.test(version)) {
      issues.push({
        name,
        version,
        reason: "Contains invalid characters",
      })
    }
  })

  return issues.map((issue) => ({ ...issue, type }))
}

// Check all dependency types
const issues = [
  ...checkDependencies(packageJson.dependencies, "dependencies"),
  ...checkDependencies(packageJson.devDependencies, "devDependencies"),
  ...checkDependencies(packageJson.peerDependencies, "peerDependencies"),
  ...checkDependencies(packageJson.optionalDependencies, "optionalDependencies"),
]

// Display issues
if (issues.length > 0) {
  console.warn(`${colors.yellow}⚠️ Found ${issues.length} potentially problematic dependencies:${colors.reset}`)
  issues.forEach(({ name, version, reason, type }) => {
    console.warn(
      `  - ${colors.magenta}${type}${colors.reset}: ${colors.yellow}${name}${colors.reset}: ${version} (${reason})`,
    )
  })

  // Create fixed package.json
  const fixedPackageJson = { ...packageJson }

  // Fix dependencies
  issues.forEach(({ name, version, type }) => {
    if (type === "dependencies" && fixedPackageJson.dependencies) {
      // For URL-like dependencies, try to use a specific version
      if (version.startsWith("http:") || version.startsWith("https:")) {
        console.log(`${colors.blue}🔧 Fixing URL dependency: ${name}${colors.reset}`)
        fixedPackageJson.dependencies[name] = "latest"
      }

      // For other problematic dependencies, use latest
      else if (
        version.includes("git") ||
        version.includes("github") ||
        version.startsWith("file:") ||
        version === "*"
      ) {
        console.log(`${colors.blue}🔧 Fixing problematic dependency: ${name}${colors.reset}`)
        fixedPackageJson.dependencies[name] = "latest"
      }
    }

    // Same for devDependencies
    if (type === "devDependencies" && fixedPackageJson.devDependencies) {
      if (version.startsWith("http:") || version.startsWith("https:")) {
        console.log(`${colors.blue}🔧 Fixing URL devDependency: ${name}${colors.reset}`)
        fixedPackageJson.devDependencies[name] = "latest"
      } else if (
        version.includes("git") ||
        version.includes("github") ||
        version.startsWith("file:") ||
        version === "*"
      ) {
        console.log(`${colors.blue}🔧 Fixing problematic devDependency: ${name}${colors.reset}`)
        fixedPackageJson.devDependencies[name] = "latest"
      }
    }
  })

  // Write fixed package.json
  const fixedPackageJsonPath = path.join(process.cwd(), "package.json.fixed")
  fs.writeFileSync(fixedPackageJsonPath, JSON.stringify(fixedPackageJson, null, 2))
  console.log(`${colors.green}✅ Created fixed package.json at package.json.fixed${colors.reset}`)
  console.log(`${colors.blue}💡 Review the changes and replace your package.json with the fixed version${colors.reset}`)

  // Show diff
  try {
    const diff = execSync(`diff -u ${packageJsonPath} ${fixedPackageJsonPath}`).toString()
    console.log(`${colors.blue}📋 Diff between original and fixed package.json:${colors.reset}`)
    console.log(diff)
  } catch (error) {
    // diff command will exit with non-zero if files are different, which is expected
    if (error.stdout) {
      console.log(`${colors.blue}📋 Diff between original and fixed package.json:${colors.reset}`)
      console.log(error.stdout.toString())
    }
  }
} else {
  console.log(`${colors.green}✅ No problematic dependencies found in package.json${colors.reset}`)
}

// Check for lockfile issues
const lockfilePath = path.join(process.cwd(), "pnpm-lock.yaml")
if (!fs.existsSync(lockfilePath)) {
  console.warn(`${colors.yellow}⚠️ pnpm-lock.yaml not found${colors.reset}`)
} else {
  console.log(`${colors.green}✅ pnpm-lock.yaml exists${colors.reset}`)

  // Check lockfile content
  const lockfileContent = fs.readFileSync(lockfilePath, "utf8")

  // Look for suspicious patterns in lockfile
  const suspiciousPatterns = ["https:", "http:", "git+", "github:", "file:", "link:", "workspace:"]

  const foundPatterns = suspiciousPatterns.filter((pattern) => lockfileContent.includes(pattern))

  if (foundPatterns.length > 0) {
    console.warn(`${colors.yellow}⚠️ Found suspicious patterns in pnpm-lock.yaml:${colors.reset}`)
    foundPatterns.forEach((pattern) => {
      console.warn(`  - ${pattern}`)
    })
    console.log(
      `${colors.blue}💡 Consider regenerating the lockfile with 'pnpm install --no-frozen-lockfile'${colors.reset}`,
    )
  } else {
    console.log(`${colors.green}✅ No suspicious patterns found in pnpm-lock.yaml${colors.reset}`)
  }
}

// Test npm registry connectivity
console.log(`${colors.blue}🔄 Testing npm registry connectivity...${colors.reset}`)
try {
  execSync("npm ping", { stdio: "pipe" })
  console.log(`${colors.green}✅ Successfully connected to npm registry${colors.reset}`)
} catch (error) {
  console.error(`${colors.red}❌ Failed to connect to npm registry:${colors.reset}`, error)
}

console.log(`${colors.blue}💡 Recommendations:${colors.reset}`)
console.log(`  1. Use the fixed package.json if issues were found`)
console.log(`  2. Run 'pnpm install --no-frozen-lockfile' to regenerate the lockfile`)
console.log(`  3. Add a .npmrc file with the following content:`)
console.log(`     registry=https://registry.npmjs.org/`)
console.log(`     strict-peer-dependencies=false`)
console.log(`     auto-install-peers=true`)
console.log(`     save-exact=true`)
console.log(`  4. Consider adding a vercel.json file with custom install commands`)
