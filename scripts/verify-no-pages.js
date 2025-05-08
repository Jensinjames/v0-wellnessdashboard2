const fs = require("fs")
const path = require("path")

// Path to the pages directory
const pagesDir = path.join(process.cwd(), "pages")

// Check if the pages directory exists
if (!fs.existsSync(pagesDir)) {
  console.log("Pages directory does not exist. Good!")
  process.exit(0)
}

// Check if the pages directory is empty (except for .gitkeep)
const files = fs.readdirSync(pagesDir)
const nonGitkeepFiles = files.filter((file) => file !== ".gitkeep")

if (nonGitkeepFiles.length === 0) {
  console.log("Pages directory is empty (except for .gitkeep). Good!")
  process.exit(0)
}

// If we get here, there are files in the pages directory
console.error("Found files in the pages directory:")
nonGitkeepFiles.forEach((file) => {
  console.error(`- ${file}`)
})

console.error("Please remove these files before building.")
process.exit(1)
