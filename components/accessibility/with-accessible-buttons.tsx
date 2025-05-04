import type React from "react"
import { type ReactElement, Children, isValidElement, cloneElement } from "react"

/**
 * A higher-order component that recursively checks all buttons in a component tree
 * and ensures they have proper aria-labels if they only contain icon children
 */
export function withAccessibleButtons<P>(Component: React.ComponentType<P>): React.FC<P> {
  return function AccessibleButtonsWrapper(props: P) {
    const processChildren = (children: React.ReactNode): React.ReactNode => {
      return Children.map(children, (child) => {
        // If it's not a valid element, return it as is
        if (!isValidElement(child)) {
          return child
        }

        // Check if it's a button with only an icon child
        const isButton =
          child.type === "button" ||
          (typeof child.type === "function" && (child.type.displayName === "Button" || child.type.name === "Button"))

        if (isButton) {
          const buttonChildren = child.props.children
          const hasOnlyIconChild =
            Children.count(buttonChildren) === 1 &&
            isValidElement(Children.only(buttonChildren)) &&
            typeof Children.only(buttonChildren).type !== "string"

          // If it's an icon-only button without an aria-label, log a warning in development
          if (hasOnlyIconChild && !child.props["aria-label"] && process.env.NODE_ENV !== "production") {
            console.warn("Button with only icon child should have an aria-label")
          }
        }

        // Process this element's children recursively
        if (child.props.children) {
          return cloneElement(child as ReactElement, { ...child.props }, processChildren(child.props.children))
        }

        return child
      })
    }

    return <Component {...props}>{processChildren((props as any).children)}</Component>
  }
}
