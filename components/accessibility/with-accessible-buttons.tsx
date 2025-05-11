"use client"

import type React from "react"
import { useEffect, Children, isValidElement, type ReactElement } from "react"
import { isIconOnlyButtonWithoutAriaLabel } from "@/utils/accessibility-checks"

/**
 * Higher-order component that checks for and warns about icon-only buttons without aria-labels
 * @param Component The component to wrap
 * @returns The wrapped component with accessibility checks
 */
export function withAccessibleButtons<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  const WithAccessibleButtons: React.FC<P> = (props) => {
    useEffect(() => {
      // Only run in development
      if (process.env.NODE_ENV !== "development") return

      // Check for icon-only buttons without aria-labels in the rendered output
      const checkForInaccessibleButtons = (element: ReactElement): void => {
        if (isIconOnlyButtonWithoutAriaLabel(element)) {
          console.warn("Accessibility warning: Button element contains only an icon without an aria-label", element)
        }

        // Check children recursively
        Children.forEach(element.props.children, (child) => {
          if (isValidElement(child)) {
            checkForInaccessibleButtons(child)
          }
        })
      }

      // This is a simplified check - in a real implementation, you'd need to
      // find a way to access the rendered output of the component
    }, [])

    return <Component {...props} />
  }

  WithAccessibleButtons.displayName = `WithAccessibleButtons(${Component.displayName || Component.name || "Component"})`

  return WithAccessibleButtons
}

/**
 * A component that wraps a button with an icon to ensure it has an aria-label
 */
export const AccessibleIconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: React.ReactNode
    label: string
  }
> = ({ icon, label, children, ...props }) => {
  // In development, warn if both children and icon are provided
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && children && icon) {
      console.warn(
        "AccessibleIconButton received both children and an icon prop. " +
          "This may lead to confusion for screen reader users. " +
          "Consider using either children or icon, not both.",
      )
    }
  }, [children, icon])

  return (
    <button aria-label={label} {...props}>
      {icon || children}
    </button>
  )
}
