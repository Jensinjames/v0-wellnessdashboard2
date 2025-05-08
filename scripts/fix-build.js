const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

console.log("Running build fix script...")

// Path to the pages directory
const pagesDir = path.join(process.cwd(), "pages")

// Delete the pages directory if it exists
if (fs.existsSync(pagesDir)) {
  console.log("Removing pages directory...")
  execSync(`rm -rf ${pagesDir}`)
}

// Create an empty pages directory with just a .gitkeep file
console.log("Creating empty pages directory...")
fs.mkdirSync(pagesDir, { recursive: true })
fs.writeFileSync(path.join(pagesDir, ".gitkeep"), "")

// Create a simple _app.js file to satisfy Next.js
console.log("Creating minimal _app.js...")
const appContent = `
// This file is intentionally minimal to avoid conflicts with the App Router
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
`
fs.writeFileSync(path.join(pagesDir, "_app.js"), appContent)

// Create a simple 404.js file
console.log("Creating minimal 404.js...")
const notFoundContent = `
// This file is intentionally minimal to avoid conflicts with the App Router
export default function NotFound() {
  return <div>Not Found</div>;
}
`
fs.writeFileSync(path.join(pagesDir, "404.js"), notFoundContent)

console.log("Build fix complete!")
