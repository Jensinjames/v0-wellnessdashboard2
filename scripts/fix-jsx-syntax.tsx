import { parse } from "@babel/parser"
import traverse from "@babel/traverse"
import generate from "@babel/generator"

// Function to fix common JSX syntax issues
export function fixJsxSyntax(code: string): string {
  try {
    // Parse the code
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    })

    // Track if we made any changes
    let madeChanges = false

    // Traverse the AST to find and fix issues
    traverse(ast, {
      JSXAttribute(path) {
        // Fix for className attributes with template literals
        if (
          path.node.name.name === "className" &&
          path.node.value?.type === "JSXExpressionContainer" &&
          path.node.value.expression.type === "TemplateLiteral"
        ) {
          // Replace with a safer approach using the cn utility
          const expressions = path.node.value.expression.expressions
          const quasis = path.node.value.expression.quasis

          // Build a safer expression
          const newExpr = `cn("${quasis[0].value.raw}"${expressions
            .map((expr, i) => `, ${generate(expr).code}, "${quasis[i + 1].value.raw}"`)
            .join("")})`

          console.log(`Fixed template literal in className: ${newExpr}`)
          madeChanges = true
        }
      },
    })

    // If we made changes, generate the fixed code
    if (madeChanges) {
      return generate(ast).code
    }

    // Otherwise return the original code
    return code
  } catch (error) {
    console.error("Error parsing JSX:", error)
    return code
  }
}

// Example usage
// const fixedCode = fixJsxSyntax(problematicCode);
