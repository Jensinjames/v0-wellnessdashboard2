const fs = require("fs")
const path = require("path")

// Function to recursively check for files in a directory
function findFiles(directory, extension) {
  if (!fs.existsSync(directory)) {
    console.log(`Directory ${directory} does not exist.`)
    return []
  }

  let results = []
  const files = fs.readdirSync(directory)

  files.forEach((file) => {
    const fullPath = path.join(directory, file)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      // Recursively check subdirectories
      results = results.concat(findFiles(fullPath, extension))
    } else if (path.extname(file) === extension) {
      // Add file to results
      results.push(fullPath)
    }
  })

  return results
}

// Check for imports of next/headers
function checkForNextHeadersImports(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  return content.includes("next/headers")
}

// Check for imports of createServerSupabaseClient
function checkForServerSupabaseClientImports(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  return content.includes("createServerSupabaseClient")
}

// Find all TypeScript files
const tsFiles = findFiles(process.cwd(), ".ts")
const tsxFiles = findFiles(process.cwd(), ".tsx")
const allFiles = [...tsFiles, ...tsxFiles]

// Check for problematic imports
const nextHeadersFiles = allFiles.filter((file) => checkForNextHeadersImports(file))
const serverSupabaseClientFiles = allFiles.filter((file) => checkForServerSupabaseClientImports(file))

// Print results
console.log("Files importing next/headers:")
nextHeadersFiles.forEach((file) => {
  console.log(`  - ${file}`)
})

console.log("\nFiles importing createServerSupabaseClient:")
serverSupabaseClientFiles.forEach((file) => {
  console.log(`  - ${file}`)
})

console.log("\nThese files might need to be updated to be compatible with both the Pages Router and App Router.")
