import fs from "fs"
import path from "path"
import { fixUnicodeEscapes } from "./fix-unicode-escapes"

// Function to recursively process all files in a directory
function processDirectory(directory: string, extensions: string[] = [".ts", ".tsx", ".js", ".jsx"]) {
  const files = fs.readdirSync(directory)

  for (const file of files) {
    const filePath = path.join(directory, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      // Skip node_modules and .next directories
      if (file !== "node_modules" && file !== ".next") {
        processDirectory(filePath, extensions)
      }
    } else if (extensions.some((ext) => file.endsWith(ext))) {
      // Process file if it has one of the specified extensions
      try {
        const content = fs.readFileSync(filePath, "utf8")
        const fixedContent = fixUnicodeEscapes(content)

        if (content !== fixedContent) {
          console.log(`Fixing Unicode escapes in: ${filePath}`)
          fs.writeFileSync(filePath, fixedContent, "utf8")
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error)
      }
    }
  }
}

// Start processing from the project root
console.log("Scanning for and fixing Unicode escape issues...")
processDirectory(".")
console.log("Done!")
