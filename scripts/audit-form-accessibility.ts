#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { parse } from "@babel/parser"
import traverse from "@babel/traverse"

const FORM_ELEMENTS = ["input", "select", "textarea", "button"]
const FORM_COMPONENTS = ["Input", "Select", "Textarea", "Button", "Checkbox", "RadioGroup", "Switch"]

function findFormElements(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8")
  const issues: string[] = []

  try {
    const ast = parse(content, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    })

    traverse(ast, {
      JSXElement(path) {
        const openingElement = path.node.openingElement
        const elementName = openingElement.name.type === "JSXIdentifier" ? openingElement.name.name.toLowerCase() : ""

        // Check if this is a form element
        if (
          FORM_ELEMENTS.includes(elementName) ||
          FORM_COMPONENTS.some(
            (comp) => openingElement.name.type === "JSXIdentifier" && openingElement.name.name === comp,
          )
        ) {
          // Check for id attribute
          const hasId = openingElement.attributes.some(
            (attr) => attr.type === "JSXAttribute" && attr.name.type === "JSXIdentifier" && attr.name.name === "id",
          )

          // Check for name attribute
          const hasName = openingElement.attributes.some(
            (attr) => attr.type === "JSXAttribute" && attr.name.type === "JSXIdentifier" && attr.name.name === "name",
          )

          // Check for aria-label attribute
          const hasAriaLabel = openingElement.attributes.some(
            (attr) =>
              attr.type === "JSXAttribute" && attr.name.type === "JSXIdentifier" && attr.name.name === "aria-label",
          )

          // Check if it's inside a label element
          const isInsideLabel = path.findParent(
            (p) =>
              p.isJSXElement() &&
              p.node.openingElement.name.type === "JSXIdentifier" &&
              p.node.openingElement.name.name.toLowerCase() === "label",
          )

          // If it's not a button and doesn't have an id, name, aria-label, or is not inside a label
          if (elementName !== "button" && !hasId && !hasName && !hasAriaLabel && !isInsideLabel) {
            const lineNumber = path.node.loc?.start.line || 0
            issues.push(`Line ${lineNumber}: ${elementName} element without id, name, aria-label, or label association`)
          }
        }
      },
    })
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error)
  }

  return issues
}

function scanDirectory(dir: string, fileExtensions: string[] = [".tsx", ".jsx"]) {
  const results: { file: string; issues: string[] }[] = []

  function scan(currentDir: string) {
    const files = fs.readdirSync(currentDir)

    for (const file of files) {
      const filePath = path.join(currentDir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        scan(filePath)
      } else if (fileExtensions.some((ext) => file.endsWith(ext))) {
        const issues = findFormElements(filePath)
        if (issues.length > 0) {
          results.push({ file: filePath, issues })
        }
      }
    }
  }

  scan(dir)
  return results
}

// Main execution
const projectRoot = process.cwd()
const results = scanDirectory(projectRoot)

if (results.length === 0) {
  console.log("✅ No accessibility issues found in form elements.")
} else {
  console.log("❌ Found accessibility issues in form elements:")

  for (const { file, issues } of results) {
    const relativePath = path.relative(projectRoot, file)
    console.log(`\n📄 ${relativePath}:`)

    for (const issue of issues) {
      console.log(`  - ${issue}`)
    }
  }

  console.log(
    `\nTotal: ${results.reduce((sum, { issues }) => sum + issues.length, 0)} issues in ${results.length} files`,
  )
}
