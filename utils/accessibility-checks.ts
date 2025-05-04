"use client"

import * as React from "react"

/**
 * Checks if a React element is an icon-only button without an aria-label
 * @param element The React element to check
 * @returns True if the element is an icon-only button without an aria-label
 */
export function isIconOnlyButtonWithoutLabel(element: React.ReactElement): boolean {
  // Check if it's a button element
  const isButton =
    element.type === "button" ||
    (typeof element.type === "function" && (element.type.displayName === "Button" || element.type.name === "Button"))

  if (!isButton) return false

  // Check if it has an aria-label
  const hasAriaLabel = !!element.props["aria-label"]

  if (hasAriaLabel) return false

  // Check if it has only icon children
  const children = React.Children.toArray(element.props.children)

  // If there's only one child and it's not a string/number, it's likely an icon
  const hasOnlyIconChild =
    children.length === 1 && React.isValidElement(children[0]) && typeof children[0].type !== "string"

  return hasOnlyIconChild
}

/**
 * A React component that wraps buttons and warns if they're icon-only without aria-labels
 */
export function AccessibleIconButton({
  children,
  "aria-label": ariaLabel,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  // In development, check if the button has only an icon child without an aria-label
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const hasOnlyIconChild =
        React.Children.count(children) === 1 &&
        React.isValidElement(React.Children.only(children)) &&
        typeof React.Children.only(children).type !== "string"

      if (hasOnlyIconChild && !ariaLabel) {
        console.warn("Button with only icon child should have an aria-label")
      }
    }
  }, [children, ariaLabel])

  return (
    <button aria-label={ariaLabel} {...props}>
      {children}
    </button>
  )
}
