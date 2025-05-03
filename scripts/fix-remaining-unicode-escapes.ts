import fs from "fs"
import path from "path"
import { fixUnicodeEscapes } from "./fix-unicode-escapes"

// Function to recursively process all files in a directory
async function processDirectory(directory: string, extensions: string[] = [".ts", ".tsx", ".js", ".jsx"]) {
  try {
    const files = await fs.promises.readdir(directory)

    for (const file of files) {
      const filePath = path.join(directory, file)
      const stats = await fs.promises.stat(filePath)

      if (stats.isDirectory()) {
        // Skip node_modules and .next directories
        if (file !== "node_modules" && file !== ".next" && file !== ".git") {
          await processDirectory(filePath, extensions)
        }
      } else if (extensions.some((ext) => file.endsWith(ext))) {
        // Process file if it has one of the specified extensions
        try {
          const content = await fs.promises.readFile(filePath, "utf8")
          const fixedContent = fixUnicodeEscapes(content)

          if (content !== fixedContent) {
            console.log(`Fixing Unicode escapes in: ${filePath}`)
            await fs.promises.writeFile(filePath, fixedContent, "utf8")
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error)
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error)
  }
}

// Enhanced Unicode escape fixer
export async function fixAllUnicodeEscapes() {
  console.log("Scanning for and fixing Unicode escape issues...")
  await processDirectory(".")
  console.log("Done!")
}

// Run the function if this script is executed directly
if (require.main === module) {
  fixAllUnicodeEscapes().catch(console.error)
}
