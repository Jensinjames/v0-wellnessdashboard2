const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")
const glob = require("glob")

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

// Find all TypeScript and JavaScript files
const files = glob.sync("**/*.{js,jsx,ts,tsx}", {
  ignore: ["node_modules/**", ".next/**", "out/**", "scripts/**"],
})

// Check each file for imports related to the Pages Router
console.log("Checking for Pages Router imports...")
let modifiedFiles = 0

files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8")
  let modified = false

  // Replace imports of next/router with next/navigation
  if (content.includes('from "next/router"') || content.includes("from 'next/router'")) {
    content = content
      .replace(/from ['"]next\/router['"]/g, 'from "next/navigation"')
      .replace(/import\s+{\s*useRouter\s*}/g, 'import { useRouter } from "next/navigation"')
    modified = true
  }

  // Replace imports of pages/ with app/
  if (content.includes('from "@/pages/') || content.includes("from '@/pages/")) {
    content = content.replace(/from ['"]@\/pages\//g, 'from "@/app/')
    modified = true
  }

  // Save the modified file
  if (modified) {
    fs.writeFileSync(file, content)
    console.log(`Modified file: ${file}`)
    modifiedFiles++
  }
})

console.log(`Modified ${modifiedFiles} files.`)

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
