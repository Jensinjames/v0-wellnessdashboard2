import fs from "fs"
import path from "path"
import { promisify } from "util"

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const stat = promisify(fs.stat)

// Directories to ignore
const ignoreDirs = ["node_modules", ".git", ".next", ".vercel", "dist", "build"]

// File extensions to check
const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs"]

async function fixUrlImports(dir: string): Promise<string[]> {
  const results: string[] = []

  try {
    const files = await readdir(dir)

    for (const file of files) {
      const filePath = path.join(dir, file)

      // Skip ignored directories
      if (ignoreDirs.some((ignoreDir) => filePath.includes(ignoreDir))) {
        continue
      }

      const stats = await stat(filePath)

      if (stats.isDirectory()) {
        // Recursively search subdirectories
        const subResults = await fixUrlImports(filePath)
        results.push(...subResults)
      } else if (extensions.includes(path.extname(file))) {
        // Check file content for URL imports
        const content = await readFile(filePath, "utf8")

        // Look for import statements with URLs
        const urlImportRegex = /import\s+.*from\s+["']https?:\/\//g
        const dynamicImportRegex = /import\s*\(["']https?:\/\//g

        if (urlImportRegex.test(content) || dynamicImportRegex.test(content)) {
          // Comment out URL imports
          let updatedContent = content.replace(
            /(import\s+.*from\s+["']https?:\/\/.*["'])/g,
            "// $1 /* URL import commented out for build */",
          )

          updatedContent = updatedContent.replace(
            /(import\s*$$["']https?:\/\/.*["']$$)/g,
            "/* URL import commented out for build */ null /* $1 */",
          )

          // Write the updated content back to the file
          await writeFile(filePath, updatedContent, "utf8")
          results.push(`Fixed URL imports in ${filePath}`)
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error)
  }

  return results
}

// Run the script
fixUrlImports(process.cwd())
  .then((results) => {
    if (results.length > 0) {
      console.log("Fixed URL imports in the following files:")
      results.forEach((result) => console.log(`- ${result}`))
    } else {
      console.log("No URL imports found that needed fixing.")
    }
  })
  .catch((error) => {
    console.error("Error running script:", error)
  })
