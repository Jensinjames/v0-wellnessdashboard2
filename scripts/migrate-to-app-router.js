/**
 * Migration script to help with transitioning from Pages Router to App Router
 *
 * This script:
 * 1. Identifies files in the pages/ directory
 * 2. Suggests App Router equivalents
 * 3. Identifies usage of next/headers in non-App Router contexts
 *
 * Usage: node scripts/migrate-to-app-router.js
 */

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Configuration
const ROOT_DIR = path.resolve(__dirname, "..")
const PAGES_DIR = path.join(ROOT_DIR, "pages")
const APP_DIR = path.join(ROOT_DIR, "app")

// Check if pages directory exists
if (!fs.existsSync(PAGES_DIR)) {
  console.log("✅ No pages/ directory found. You are already using App Router exclusively.")
  process.exit(0)
}

// Find all files in the pages directory
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      findFiles(filePath, fileList)
    } else {
      fileList.push(filePath)
    }
  })

  return fileList
}

// Map Pages Router paths to App Router paths
function mapToAppRouter(pagePath) {
  // Remove the pages directory prefix
  const relativePath = pagePath.replace(PAGES_DIR, "")

  // Handle special cases
  if (relativePath.startsWith("/api/")) {
    // API routes
    const apiPath = relativePath.replace(".ts", "").replace(".js", "")
    return `app${apiPath}/route.ts`
  } else if (relativePath.includes("_app.") || relativePath.includes("_document.")) {
    // _app and _document files
    return "app/layout.tsx (merge functionality)"
  } else if (relativePath.includes("_middleware.")) {
    // Middleware
    return "middleware.ts (at project root)"
  } else if (relativePath.includes("[") && relativePath.includes("]")) {
    // Dynamic routes
    const dynamicPath = relativePath
      .replace(/\[([^\]]+)\]/g, "$1") // Replace [param] with param
      .replace(/\.tsx$|\.jsx$|\.ts$|\.js$/, "")

    if (dynamicPath.endsWith("/index")) {
      return `app${dynamicPath.replace("/index", "")}/[...params]/page.tsx`
    }
    return `app${dynamicPath}/page.tsx`
  } else {
    // Regular pages
    const normalPath = relativePath.replace(/\.tsx$|\.jsx$|\.ts$|\.js$/, "")

    if (normalPath.endsWith("/index")) {
      return `app${normalPath.replace("/index", "")}/page.tsx`
    }
    return `app${normalPath}/page.tsx`
  }
}

// Check for next/headers usage in files
function checkForNextHeaders(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  return content.includes("next/headers")
}

// Main execution
console.log("🔍 Analyzing project for Pages Router to App Router migration...\n")

// Find all files in pages directory
const pagesFiles = findFiles(PAGES_DIR)
console.log(`Found ${pagesFiles.length} files in pages/ directory.\n`)

// Generate migration plan
console.log("📋 Migration Plan:")
console.log("=================\n")

pagesFiles.forEach((file) => {
  const appRouterEquivalent = mapToAppRouter(file)
  const usesNextHeaders = checkForNextHeaders(file)

  console.log(`${file} → ${appRouterEquivalent}`)
  if (usesNextHeaders) {
    console.log(`  ⚠️ WARNING: This file uses next/headers which is only compatible with App Router`)
  }
  console.log("")
})

// Check for next/headers usage in other files
console.log("\n🔍 Checking for next/headers usage in other files...")

try {
  const grepResult = execSync(
    'grep -r "next/headers" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . --exclude-dir=node_modules --exclude-dir=.next',
    { encoding: "utf8" },
  )

  const lines = grepResult.split("\n").filter((line) => line && !line.includes("/app/"))

  if (lines.length > 0) {
    console.log("\n⚠️ Found next/headers usage outside of app/ directory:")
    lines.forEach((line) => {
      console.log(`  ${line}`)
    })
    console.log("\nThese files need to be updated to use App Router compatible APIs.")
  } else {
    console.log("✅ No problematic next/headers usage found outside of app/ directory.")
  }
} catch (error) {
  // grep returns non-zero exit code if no matches found
  console.log("✅ No problematic next/headers usage found outside of app/ directory.")
}

console.log("\n📝 Next Steps:")
console.log("1. Move all pages to their App Router equivalents")
console.log("2. Update API routes to use Route Handlers")
console.log("3. Update middleware to use App Router patterns")
console.log("4. Remove the pages/ directory once migration is complete")
console.log("\nRefer to the Next.js migration guide for more details:")
console.log("https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration")
