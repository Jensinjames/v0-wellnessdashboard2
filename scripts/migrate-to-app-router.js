/**
 * This script helps migrate a Next.js project from Pages Router to App Router
 * by identifying files that need to be moved and suggesting changes.
 */

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Configuration
const pagesDir = "pages"
const appDir = "app"
const componentsDir = "components"

// Create app directory if it doesn't exist
if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir)
  console.log(`Created ${appDir} directory`)
}

// Function to identify page files
function findPageFiles() {
  if (!fs.existsSync(pagesDir)) {
    console.log("No pages directory found. Skipping page migration.")
    return []
  }

  const pageFiles = []

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        scanDirectory(fullPath)
      } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        // Skip _app, _document, and API routes for now
        if (!/^_app|^_document|^api\//.test(path.relative(pagesDir, fullPath))) {
          pageFiles.push(fullPath)
        }
      }
    }
  }

  scanDirectory(pagesDir)
  return pageFiles
}

// Function to suggest app router path for a page file
function suggestAppRouterPath(pageFile) {
  const relativePath = path.relative(pagesDir, pageFile)
  const parsedPath = path.parse(relativePath)

  // Handle index files
  if (parsedPath.name === "index") {
    return path.join(appDir, parsedPath.dir, "page" + parsedPath.ext)
  }

  // Handle dynamic routes
  const dirName = parsedPath.name.replace(/^\[(.+)\]$/, "$1")
  if (dirName !== parsedPath.name) {
    return path.join(appDir, parsedPath.dir, `[${dirName}]`, "page" + parsedPath.ext)
  }

  // Handle regular pages
  return path.join(appDir, parsedPath.dir, parsedPath.name, "page" + parsedPath.ext)
}

// Function to analyze a file for client components
function analyzeFileForClientComponents(filePath) {
  const content = fs.readFileSync(filePath, "utf8")

  const clientHooks = [
    "useState",
    "useEffect",
    "useContext",
    "useReducer",
    "useCallback",
    "useMemo",
    "useRef",
    "useImperativeHandle",
    "useLayoutEffect",
    "useDebugValue",
  ]

  const foundHooks = []

  for (const hook of clientHooks) {
    const regex = new RegExp(`\\b${hook}\\s*\\(`, "g")
    if (regex.test(content)) {
      foundHooks.push(hook)
    }
  }

  // Check for event handlers
  const hasEventHandlers = /on\w+\s*=\s*\{/.test(content)

  // Check for browser APIs
  const hasBrowserAPIs = /\bwindow\b|\bdocument\b|\blocalStorage\b|\bsessionStorage\b/.test(content)

  return {
    needsClientDirective: foundHooks.length > 0 || hasEventHandlers || hasBrowserAPIs,
    foundHooks,
    hasEventHandlers,
    hasBrowserAPIs,
  }
}

// Main execution
console.log("Starting migration analysis from Pages Router to App Router...")

// Find page files
const pageFiles = findPageFiles()
console.log(`Found ${pageFiles.length} page files to analyze.`)

// Analyze each page file
const migrationPlan = []

for (const pageFile of pageFiles) {
  const appRouterPath = suggestAppRouterPath(pageFile)
  const analysis = analyzeFileForClientComponents(pageFile)

  migrationPlan.push({
    currentPath: pageFile,
    suggestedPath: appRouterPath,
    analysis,
  })
}

// Print migration plan
console.log("\nMigration Plan:")
console.log("==============")

for (const item of migrationPlan) {
  console.log(`\nFile: ${item.currentPath}`)
  console.log(`Suggested App Router path: ${item.suggestedPath}`)

  if (item.analysis.needsClientDirective) {
    console.log('Needs "use client" directive because:')

    if (item.analysis.foundHooks.length > 0) {
      console.log(`- Uses React hooks: ${item.analysis.foundHooks.join(", ")}`)
    }

    if (item.analysis.hasEventHandlers) {
      console.log("- Contains event handlers")
    }

    if (item.analysis.hasBrowserAPIs) {
      console.log("- Uses browser APIs")
    }
  } else {
    console.log("Can be a Server Component (no client-side features detected)")
  }
}

// Suggest next steps
console.log("\nNext Steps:")
console.log("1. Create a layout.tsx file in the app directory")
console.log('2. Move your pages one by one, adding "use client" directives where needed')
console.log("3. Update imports and paths")
console.log("4. Test each page after migration")
console.log("5. Move API routes to route handlers")

console.log("\nMigration analysis complete!")
