/**
 * Find Deprecated Hooks
 *
 * This script scans the codebase for usage of deprecated hooks
 * and provides guidance on migration.
 */

import fs from "fs"
import path from "path"
import { promisify } from "util"

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const stat = promisify(fs.stat)

const DEPRECATED_HOOKS = [
  {
    name: "useOptimizedSupabase",
    import: /import.*useOptimizedSupabase.*from/,
    usage: /useOptimizedSupabase\(/,
    migrationPath: "useSupabase or useSupabaseQuery",
  },
]

async function scanDirectory(dir: string): Promise<string[]> {
  const results: string[] = []
  const files = await readdir(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stats = await stat(filePath)

    if (stats.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        const subResults = await scanDirectory(filePath)
        results.push(...subResults)
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      results.push(filePath)
    }
  }

  return results
}

async function findDeprecatedHooks() {
  console.log("Scanning for deprecated hooks...")
  const files = await scanDirectory(".")
  const results: Record<string, string[]> = {}

  for (const file of files) {
    const content = await readFile(file, "utf8")

    for (const hook of DEPRECATED_HOOKS) {
      if (hook.import.test(content) || hook.usage.test(content)) {
        if (!results[hook.name]) {
          results[hook.name] = []
        }
        results[hook.name].push(file)
      }
    }
  }

  console.log("\nResults:")
  let foundAny = false

  for (const [hook, files] of Object.entries(results)) {
    if (files.length > 0) {
      foundAny = true
      const deprecatedHook = DEPRECATED_HOOKS.find((h) => h.name === hook)

      console.log(`\n${hook} (deprecated):`)
      console.log(`Migration path: ${deprecatedHook?.migrationPath}`)
      console.log("Found in:")

      for (const file of files) {
        console.log(`  - ${file}`)
      }
    }
  }

  if (!foundAny) {
    console.log("No deprecated hooks found. Great job!")
  } else {
    console.log("\nPlease refer to docs/supabase-hooks-migration.md for migration guidance.")
  }
}

findDeprecatedHooks().catch(console.error)
