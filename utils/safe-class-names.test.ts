import { safeCn, conditionalCn, variantCn, colorCn, responsiveCn, toSafeClassName } from "./safe-class-names"

// Example usage
function exampleUsage() {
  // Basic usage - similar to cn but with extra safety
  const className1 = safeCn("text-red-500", "bg-blue-200", undefined, null)
  console.log(className1) // "text-red-500 bg-blue-200"

  // Conditional classes
  const isActive = true
  const isDisabled = false
  const className2 = conditionalCn("btn", {
    "btn-active": isActive,
    "btn-disabled": isDisabled,
    "opacity-50": isDisabled,
  })
  console.log(className2) // "btn btn-active"

  // Variant-based classes
  const variants = {
    primary: "bg-blue-500 text-white",
    secondary: "bg-gray-200 text-gray-800",
    danger: "bg-red-500 text-white",
  }
  const className3 = variantCn(variants, "primary")
  console.log(className3) // "bg-blue-500 text-white"

  // Color utility
  const bgColor = colorCn("bg", "red", "500")
  const textColor = colorCn("text", "blue-600")
  console.log(bgColor, textColor) // "bg-red-500 text-blue-600"

  // Responsive classes
  const responsiveClasses = responsiveCn("text-sm", {
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  })
  console.log(responsiveClasses) // "text-sm md:text-base lg:text-lg xl:text-xl"

  // Handling potentially unsafe values
  const userInput = { type: "text", className: "user-input" }
  const safeClass = toSafeClassName(userInput)
  console.log(safeClass) // "" (with warning in development)
}
