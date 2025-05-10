import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function safeCn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A safe version of toClassName that ensures the result is a string
 */
export function toSafeClassName(value: any): string {
  if (typeof value === "string") {
    return value
  }

  if (typeof value === "number") {
    return String(value)
  }

  if (typeof value === "boolean" || value === null || value === undefined) {
    return ""
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).map(toSafeClassName).join(" ")
  }

  if (typeof value === "object") {
    console.warn("Object as class name", value)
    return ""
  }

  console.warn("Unrecognized class name", value)
  return ""
}

/**
 * Creates class names based on conditions
 * @param baseClasses - Base classes that are always applied
 * @param conditionalClasses - Object with classes as keys and conditions as values
 */
export function conditionalCn(baseClasses: string, conditionalClasses: Record<string, boolean> = {}): string {
  const classes = [baseClasses]

  Object.entries(conditionalClasses).forEach(([className, condition]) => {
    if (condition) {
      classes.push(className)
    }
  })

  return safeCn(...classes)
}

/**
 * Creates a color class name with the given prefix, color, and optional shade
 * @param prefix - The Tailwind prefix (bg, text, border, etc.)
 * @param color - The color name (red, blue, green, etc.) or color-shade (red-500)
 * @param shade - Optional shade (100, 200, 300, etc.)
 * @param options - Additional options
 */
export function colorCn(
  prefix: string,
  color: string,
  shade?: string,
  options: {
    dark?: string
    hover?: string
    focus?: string
  } = {},
): string {
  // Handle case where color already includes shade (e.g., "red-500")
  if (color.includes("-") && !shade) {
    const parts = color.split("-")
    color = parts[0]
    shade = parts[1]
  }

  const colorClass = shade ? `${prefix}-${color}-${shade}` : `${prefix}-${color}`
  const classes = [colorClass]

  if (options.dark) {
    classes.push(options.dark)
  }

  if (options.hover) {
    classes.push(options.hover)
  }

  if (options.focus) {
    classes.push(options.focus)
  }

  return safeCn(...classes)
}

/**
 * Creates class names based on a variant
 * @param variants - Object with variant names as keys and class names as values
 * @param selectedVariant - The selected variant
 * @param defaultVariant - Optional default variant
 */
export function variantCn(variants: Record<string, string>, selectedVariant: string, defaultVariant?: string): string {
  // If the selected variant exists, use it
  if (variants[selectedVariant]) {
    return safeCn(variants[selectedVariant])
  }

  // Otherwise, use the default variant if provided
  if (defaultVariant && variants[defaultVariant]) {
    return safeCn(variants[defaultVariant])
  }

  // If no variant is found, return an empty string
  return ""
}

/**
 * Creates responsive class names with proper breakpoint prefixes
 * @param baseClass - Base class for all screen sizes
 * @param breakpoints - Object with breakpoint names as keys and class names as values
 */
export function responsiveCn(
  baseClass: string,
  breakpoints: Partial<Record<"sm" | "md" | "lg" | "xl" | "2xl", string>> = {},
): string {
  const classes = [baseClass]

  Object.entries(breakpoints).forEach(([breakpoint, className]) => {
    if (className) {
      classes.push(`${breakpoint}:${className}`)
    }
  })

  return safeCn(...classes)
}
