"use client"

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

console.log("Creating minimal pages directory...")

// Path to the pages directory
const pagesDir = path.join(process.cwd(), "pages")

// Delete the pages directory if it exists
if (fs.existsSync(pagesDir)) {
  console.log("Removing existing pages directory...")
  execSync(`rm -rf ${pagesDir}`)
}

// Create the pages directory
console.log("Creating pages directory structure...")
fs.mkdirSync(pagesDir, { recursive: true })
fs.mkdirSync(path.join(pagesDir, "api"), { recursive: true })

// Create a minimal _app.js
const appContent = `
import '../app/globals.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
`
fs.writeFileSync(path.join(pagesDir, "_app.js"), appContent)

// Create a minimal index.js
const indexContent = `
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the App Router home page
    router.replace('/');
  }, [router]);
  
  return <div>Redirecting...</div>;
}
`
fs.writeFileSync(path.join(pagesDir, "index.js"), indexContent)

// Create a minimal 404.js
const notFoundContent = `
export default function NotFound() {
  return <div>Not Found</div>;
}
`
fs.writeFileSync(path.join(pagesDir, "404.js"), notFoundContent)

// Create a minimal _document.js
const documentContent = `
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
`
fs.writeFileSync(path.join(pagesDir, "_document.js"), documentContent)

// Create a minimal API route
const apiContent = `
export default function handler(req, res) {
  res.status(200).json({ message: 'API route is working' });
}
`
fs.writeFileSync(path.join(pagesDir, "api", "hello.js"), apiContent)

console.log("Minimal pages directory created!")
