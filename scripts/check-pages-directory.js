const fs = require("fs")
const path = require("path")

// Function to recursively check for files in a directory
function checkDirectory(directory) {
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
      results = results.concat(checkDirectory(fullPath))
    } else {
      // Add file to results
      results.push(fullPath)
    }
  })

  return results
}

// Check the pages directory
const pagesDirectory = path.join(process.cwd(), "pages")
const pagesFiles = checkDirectory(pagesDirectory)

if (pagesFiles.length > 0) {
  console.log("Found files in pages directory:")
  pagesFiles.forEach((file) => {
    console.log(`  - ${file}`)
  })
  console.log("\nThese files might be causing conflicts with the App Router.")
} else {
  console.log("No files found in pages directory. Good!")
}
