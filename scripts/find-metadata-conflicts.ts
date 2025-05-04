import fs from "fs"
import path from "path"

// Function to check if a file has both metadata and generateMetadata exports
function checkFile(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, "utf8")
    const hasMetadata = /export\s+const\s+metadata\s*=/i.test(content)
    const hasGenerateMetadata = /export\s+(async\s+)?function\s+generateMetadata/i.test(content)

    if (hasMetadata && hasGenerateMetadata) {
      console.log(`Found conflict in: ${filePath}`)
      return true
    }
    return false
  } catch (error) {
    return false
  }
}

// Function to recursively scan directories
function scanDirectory(dir: string): void {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      scanDirectory(filePath)
    } else if (stats.isFile() && (file.endsWith(".tsx") || file.endsWith(".ts"))) {
      checkFile(filePath)
    }
  }
}

// Start scanning from the app directory
scanDirectory("./app")
