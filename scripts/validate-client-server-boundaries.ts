#!/usr/bin/env node

import fs from "fs"
import { promisify } from "util"
import { glob } from "glob"

// Convert callbacks to promises
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

// Define patterns to search for
const HOOK_PATTERN = /\b(use[A-Z][a-zA-Z]*)\b(?!\s*=)/g
const CLIENT_DIRECTIVE = '"use client"'
const SERVER_COMPONENT_MARKERS = [
  "export const dynamic",
  "export async function",
  "export default async function",
  "export const revalidate",
  "export const fetchCache",
  "export const runtime",
  "export const preferredRegion",
]

// Paths to exclude
const EXCLUDED_PATHS = ["node_modules", ".next", "dist", "out", "public"]

// React hooks that should trigger warnings
const REACT_HOOKS = [
  "useState",
  "useEffect",
  "useContext",
  "useReducer",
  "useCallback",
  "useMemo",
  "useRef",
  "useLayoutEffect",
  "useImperativeHandle",
  "useDebugValue",
  "useDeferredValue",
  "useTransition",
  "useId",
]

async function main() {
  try {
    console.log("Validating client/server component boundaries...")

    // Find all TypeScript/TSX files
    const files = await glob("**/*.{ts,tsx}", {
      ignore: EXCLUDED_PATHS.map((p) => `**/${p}/**`),
    })

    let issuesFound = 0

    for (const file of files) {
      const content = await readFile(file, "utf8")

      // Skip files in excluded directories
      if (EXCLUDED_PATHS.some((excluded) => file.includes(`/${excluded}/`))) {
        continue
      }

      // Only check component files (tsx) or files that might have hooks
      if (!file.endsWith(".tsx") && !content.includes("use")) {
        continue
      }

      // Check if the file contains React hooks
      const hooks = content.match(HOOK_PATTERN)

      // Identify if the file has hooks that require client components
      const hasReactHooks = hooks?.some(
        (hook) => REACT_HOOKS.includes(hook) || (hook.startsWith("use") && hook[3]?.toUpperCase() === hook[3]),
      )

      // Check if the file is likely a server component
      const isLikelyServerComponent = SERVER_COMPONENT_MARKERS.some((marker) => content.includes(marker))

      // Check for client directive
      const hasClientDirective = content.includes(CLIENT_DIRECTIVE)

      // Issue: File uses hooks but doesn't have the client directive
      if (hasReactHooks && !hasClientDirective) {
        console.error(`[ERROR] ${file}: Uses hooks but missing "use client" directive`)
        console.log(
          "  Hooks found:",
          [
            ...new Set(
              hooks?.filter((h) => REACT_HOOKS.includes(h) || (h.startsWith("use") && h[3]?.toUpperCase() === h[3])),
            ),
          ].join(", "),
        )
        issuesFound++
      }

      // Warning: File might be a server component but has client directive
      if (isLikelyServerComponent && hasClientDirective) {
        console.warn(`[WARNING] ${file}: Has server component markers but also has "use client" directive`)
        issuesFound++
      }
    }

    if (issuesFound === 0) {
      console.log("✅ All components have proper client/server boundaries!")
    } else {
      console.log(`❌ Found ${issuesFound} issue(s) with client/server component boundaries.`)
      console.log(
        'Please review the errors above and ensure all components using hooks have the "use client" directive.',
      )
      process.exit(1)
    }
  } catch (error) {
    console.error("Error validating components:", error)
    process.exit(1)
  }
}

main()
