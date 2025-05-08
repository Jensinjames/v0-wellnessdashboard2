"use client"

const fs = require("fs")
const path = require("path")

console.log("Creating minimal pages directory...")

// Path to the pages directory
const pagesDir = path.join(process.cwd(), "pages")

// Delete the pages directory if it exists
if (fs.existsSync(pagesDir)) {
  console.log("Removing existing pages directory...")

  // Function to recursively delete a directory
  const deleteDirectory = (dirPath) => {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((file) => {
        const curPath = path.join(dirPath, file)
        if (fs.lstatSync(curPath).isDirectory()) {
          // Recursive call for directories
          deleteDirectory(curPath)
        } else {
          // Delete file
          fs.unlinkSync(curPath)
        }
      })
      fs.rmdirSync(dirPath)
    }
  }

  deleteDirectory(pagesDir)
}

// Create the pages directory
fs.mkdirSync(pagesDir, { recursive: true })

// Create a simple _app.js file
console.log("Creating minimal _app.js...")
const appContent = `
// This file is intentionally minimal to avoid conflicts with the App Router
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
`
fs.writeFileSync(path.join(pagesDir, "_app.js"), appContent)

// Create a simple index.js file that redirects to the app router
console.log("Creating minimal index.js...")
const indexContent = `
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/');
  }, [router]);
  
  return null;
}
`
fs.writeFileSync(path.join(pagesDir, "index.js"), indexContent)

// Create a simple 404.js file
console.log("Creating minimal 404.js...")
const notFoundContent = `
export default function NotFound() {
  return <div>Not Found</div>;
}
`
fs.writeFileSync(path.join(pagesDir, "404.js"), notFoundContent)

console.log("Minimal pages directory created successfully!")
