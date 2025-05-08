const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Function to recursively delete a directory
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file)
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call for directories
        deleteFolderRecursive(curPath)
      } else {
        // Delete file
        fs.unlinkSync(curPath)
        console.log(`Deleted file: ${curPath}`)
      }
    })

    // Delete the empty directory
    fs.rmdirSync(folderPath)
    console.log(`Deleted directory: ${folderPath}`)
  } else {
    console.log(`Directory does not exist: ${folderPath}`)
  }
}

// Path to the pages directory
const pagesDir = path.join(process.cwd(), "pages")

// Delete the pages directory
console.log("Removing pages directory...")
deleteFolderRecursive(pagesDir)

// Create a .gitkeep file to ensure the directory exists but is empty
console.log("Creating empty pages directory...")
fs.mkdirSync(pagesDir, { recursive: true })
fs.writeFileSync(path.join(pagesDir, ".gitkeep"), "")

console.log("Done!")

// Run next build to see if the error persists
console.log("Running next build to check for errors...")
try {
  execSync("next build", { stdio: "inherit" })
  console.log("Build successful!")
} catch (error) {
  console.error("Build failed:", error.message)
}
