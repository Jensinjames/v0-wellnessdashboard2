const fs = require("fs")
const path = require("path")
const glob = require("glob")

// List of files that are known to use next/headers
const serverComponentFiles = [
  "lib/supabase-server.ts",
  "app/api/auth/callback/route.ts",
  "app/auth/callback/route.ts",
  "app/auth/callback/route-fixed.ts",
]

// Find all TypeScript and JavaScript files
const files = glob.sync("**/*.{js,jsx,ts,tsx}", {
  ignore: ["node_modules/**", ".next/**", "out/**", "scripts/**"],
})

// Check each file for imports of server components
let foundImports = false

files.forEach((file) => {
  // Skip server component files themselves
  if (serverComponentFiles.includes(file)) {
    return
  }

  // Skip files in the app directory (they can use server components)
  if (file.startsWith("app/")) {
    return
  }

  const content = fs.readFileSync(file, "utf8")

  // Check for imports of server components
  for (const serverFile of serverComponentFiles) {
    const importPath = serverFile.replace(/\.[jt]sx?$/, "")
    if (content.includes(`from '@/${importPath}'`) || content.includes(`from "@/${importPath}"`)) {
      console.log(`Found import of server component ${serverFile} in ${file}`)
      foundImports = true
    }
  }
})

if (!foundImports) {
  console.log("No imports of server components found in client components!")
} else {
  console.error("Found imports of server components in client components. Please fix these before building.")
  process.exit(1)
}
