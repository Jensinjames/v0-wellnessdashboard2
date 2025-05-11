# Safe Class Names Utility

This utility provides a robust way to handle dynamic class names in React components, preventing common errors like "Objects are not valid as a React child".

## Core Functions

### `safeCn(...inputs)`

An enhanced version of the `cn` utility that ensures all class names are valid strings.

\`\`\`tsx
import { safeCn } from "@/utils/safe-class-names"

// Basic usage
const className = safeCn("text-red-500", isActive && "bg-blue-200", undefined)
\`\`\`

### `conditionalCn(baseClasses, conditionalClasses)`

Creates class names based on conditions.

\`\`\`tsx
import { conditionalCn } from "@/utils/safe-class-names"

const buttonClass = conditionalCn(
  "btn", // Base classes
  {
    "btn-primary": isPrimary,
    "btn-disabled": isDisabled,
    "opacity-50": isDisabled
  }
)
\`\`\`

### `variantCn(variants, selectedVariant, defaultVariant?)`

Selects class names based on a variant.

\`\`\`tsx
import { variantCn } from "@/utils/safe-class-names"

const variants = {
  primary: "bg-blue-500 text-white",
  secondary: "bg-gray-200 text-gray-800",
  danger: "bg-red-500 text-white"
}

const buttonClass = variantCn(variants, "primary")
\`\`\`

### `colorCn(prefix, color, shade?)`

Generates Tailwind color class names.

\`\`\`tsx
import { colorCn } from "@/utils/safe-class-names"

// These all produce equivalent output
const bgColor1 = colorCn("bg", "red", 500) // "bg-red-500"
const bgColor2 = colorCn("bg", "red-500")  // "bg-red-500"
\`\`\`

### `responsiveCn(baseClass, breakpoints)`

Creates responsive class names.

\`\`\`tsx
import { responsiveCn } from "@/utils/safe-class-names"

const responsiveText = responsiveCn(
  "text-sm", // Base class
  {
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl"
  }
)
\`\`\`

## Best Practices

1. Use `safeCn` instead of `cn` when working with dynamic or user-generated class names
2. Use `conditionalCn` for toggle-based styling
3. Use `variantCn` for component variants
4. Use `colorCn` for dynamic color generation
5. Use `responsiveCn` for responsive designs

## Error Prevention

This utility helps prevent:

- "Objects are not valid as a React child" errors
- Class name merging issues
- Undefined or null class name errors
- Type errors with dynamic class names
