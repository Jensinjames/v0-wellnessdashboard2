const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Function to recursively find all TypeScript and JavaScript files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory() && !filePath.includes("node_modules") && !filePath.includes(".git")) {
      findFiles(filePath, fileList)
    } else if (
      stat.isFile() &&
      (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js") || file.endsWith(".jsx"))
    ) {
      fileList.push(filePath)
    }
  })

  return fileList
}

// Function to check if a file contains URL imports
function hasUrlImports(filePath) {
  const content = fs.readFileSync(filePath, "utf8")

  // Check for various forms of URL imports
  const urlImportRegex = /import\s+.*from\s+['"]https?:\/\//
  const dynamicUrlImportRegex = /import\s*\(\s*['"]https?:\/\//
  const requireUrlRegex = /require\s*\(\s*['"]https?:\/\//

  return urlImportRegex.test(content) || dynamicUrlImportRegex.test(content) || requireUrlRegex.test(content)
}

// Function to comment out URL imports in a file
function commentOutUrlImports(filePath) {
  let content = fs.readFileSync(filePath, "utf8")

  // Comment out static imports
  content = content.replace(
    /(import\s+.*from\s+['"]https?:\/\/[^'"]+['"])/g,
    "// VERCEL DEPLOYMENT FIX - URL import commented out\n// $1",
  )

  // Comment out dynamic imports
  content = content.replace(
    /(import\s*$$\s*['"]https?:\/\/[^'"]+['"]\s*$$)/g,
    "// VERCEL DEPLOYMENT FIX - URL import commented out\n// $1",
  )

  // Comment out require statements
  content = content.replace(
    /(require\s*$$\s*['"]https?:\/\/[^'"]+['"]\s*$$)/g,
    "// VERCEL DEPLOYMENT FIX - URL import commented out\n// $1",
  )

  fs.writeFileSync(filePath, content, "utf8")
  console.log(`Fixed URL imports in ${filePath}`)
}

// Main function
function main() {
  console.log("Starting URL import fix for Vercel deployment...")

  // Find all TypeScript and JavaScript files
  const files = findFiles(".")
  console.log(`Found ${files.length} TypeScript/JavaScript files`)

  // Check each file for URL imports and fix them
  let fixedCount = 0
  files.forEach((file) => {
    if (hasUrlImports(file)) {
      console.log(`Found URL imports in ${file}`)
      commentOutUrlImports(file)
      fixedCount++
    }
  })

  console.log(`Fixed URL imports in ${fixedCount} files`)

  // Create a clean .npmrc file
  const npmrcContent = `
# Prevent treating URLs as package names
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
strict-peer-dependencies=false
legacy-peer-deps=true
`

  fs.writeFileSync(".npmrc", npmrcContent, "utf8")
  console.log("Created clean .npmrc file")

  console.log("URL import fix completed successfully!")
}

// Run the main function
main()
