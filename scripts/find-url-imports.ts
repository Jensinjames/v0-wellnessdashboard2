import fs from "fs"
import path from "path"
import { promisify } from "util"

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const stat = promisify(fs.stat)

// Directories to ignore
const ignoreDirs = ["node_modules", ".git", ".next", "supabase", ".vercel"]

// File extensions to check
const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs"]

async function findUrlImports(dir: string): Promise<string[]> {
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
        const subResults = await findUrlImports(filePath)
        results.push(...subResults)
      } else if (extensions.includes(path.extname(file))) {
        // Check file content for URL imports
        const content = await readFile(filePath, "utf8")

        // Look for import statements with URLs
        const urlImportRegex = /import\s+.*from\s+["']https?:\/\//g
        const dynamicImportRegex = /import\s*\(["']https?:\/\//g

        if (urlImportRegex.test(content) || dynamicImportRegex.test(content)) {
          results.push(`${filePath} contains URL imports`)
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error)
  }

  return results
}

// Run the script
findUrlImports(process.cwd())
  .then((results) => {
    if (results.length > 0) {
      console.log("Found URL imports in the following files:")
      results.forEach((result) => console.log(`- ${result}`))
    } else {
      console.log("No URL imports found outside of ignored directories.")
    }
  })
  .catch((error) => {
    console.error("Error running script:", error)
  })
