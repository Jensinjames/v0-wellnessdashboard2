/**
 * Utility functions for accessibility checks
 */

import { type ReactElement, Children, isValidElement } from "react"

/**
 * Checks if a button element contains only an icon child element without an aria-label
 * @param element The React element to check
 * @returns True if the element is a button with only an icon child and no aria-label
 */
export function isIconOnlyButtonWithoutAriaLabel(element: ReactElement): boolean {
  // Check if the element is a button
  if (element.type !== "button" && element.props?.role !== "button") {
    return false
  }

  // Check if the button has an aria-label
  if (element.props?.["aria-label"]) {
    return false
  }

  // Check if the button has only one child and it's an icon
  const children = Children.toArray(element.props.children)

  if (children.length !== 1) {
    return false
  }

  const child = children[0]

  // Check if the child is a valid React element
  if (!isValidElement(child)) {
    return false
  }

  // Check if the child is an icon (common icon component names)
  const iconComponentNames = [
    "svg",
    "Icon",
    "LucideIcon",
    "FontAwesomeIcon",
    "MdIcon",
    "FaIcon",
    "IoIcon",
    "BiIcon",
    "RiIcon",
  ]

  const childType =
    typeof child.type === "string" ? child.type : (child.type as any)?.displayName || (child.type as any)?.name

  return iconComponentNames.some(
    (name) => childType === name || (typeof childType === "string" && childType.includes("Icon")),
  )
}

/**
 * Checks if an element has a valid color contrast ratio
 * @param foregroundColor The foreground color
 * @param backgroundColor The background color
 * @returns True if the contrast ratio meets WCAG AA standards
 */
export function hasValidContrastRatio(foregroundColor: string, backgroundColor: string): boolean {
  // This is a simplified check - in a real app, you'd use a library like 'color'
  // to calculate the actual contrast ratio

  // For now, we'll just check if the colors are in our known problematic pairs
  const problematicPairs = [
    { fg: "text-blue-100", bg: "bg-blue-500" },
    { fg: "text-green-500", bg: "bg-white" },
    { fg: "text-red-500", bg: "bg-white" },
    { fg: "text-gray-400", bg: "bg-gray-100" },
  ]

  return !problematicPairs.some((pair) => foregroundColor.includes(pair.fg) && backgroundColor.includes(pair.bg))
}

/**
 * Checks if an ID is unique in the document
 * @param id The ID to check
 * @returns True if the ID is unique
 */
export function isIdUnique(id: string): boolean {
  if (typeof document === "undefined") return true // SSR check

  const elements = document.querySelectorAll(`#${CSS.escape(id)}`)
  return elements.length <= 1
}

/**
 * Checks if an element has valid ARIA attributes
 * @param props The props of the element
 * @returns True if all ARIA attributes are valid
 */
export function hasValidAriaAttributes(props: Record<string, any>): boolean {
  // Check for common ARIA attribute errors

  // 1. aria-labelledby must reference existing IDs
  if (props["aria-labelledby"] && typeof document !== "undefined") {
    const ids = props["aria-labelledby"].split(" ")
    for (const id of ids) {
      if (!document.getElementById(id)) {
        return false
      }
    }
  }

  // 2. aria-describedby must reference existing IDs
  if (props["aria-describedby"] && typeof document !== "undefined") {
    const ids = props["aria-describedby"].split(" ")
    for (const id of ids) {
      if (!document.getElementById(id)) {
        return false
      }
    }
  }

  // 3. aria-controls must reference existing IDs
  if (props["aria-controls"] && typeof document !== "undefined") {
    const ids = props["aria-controls"].split(" ")
    for (const id of ids) {
      if (!document.getElementById(id)) {
        return false
      }
    }
  }

  // 4. Check for empty aria-label
  if (props["aria-label"] === "") {
    return false
  }

  // 5. Check for invalid aria-pressed values
  if (
    props["aria-pressed"] !== undefined &&
    props["aria-pressed"] !== true &&
    props["aria-pressed"] !== false &&
    props["aria-pressed"] !== "true" &&
    props["aria-pressed"] !== "false" &&
    props["aria-pressed"] !== "mixed"
  ) {
    return false
  }

  // 6. Check for invalid aria-expanded values
  if (
    props["aria-expanded"] !== undefined &&
    props["aria-expanded"] !== true &&
    props["aria-expanded"] !== false &&
    props["aria-expanded"] !== "true" &&
    props["aria-expanded"] !== "false"
  ) {
    return false
  }

  return true
}

/**
 * Checks if an element has a valid role
 * @param role The role to check
 * @returns True if the role is valid
 */
export function isValidRole(role: string): boolean {
  const validRoles = [
    "alert",
    "alertdialog",
    "application",
    "article",
    "banner",
    "button",
    "cell",
    "checkbox",
    "columnheader",
    "combobox",
    "complementary",
    "contentinfo",
    "definition",
    "dialog",
    "directory",
    "document",
    "feed",
    "figure",
    "form",
    "grid",
    "gridcell",
    "group",
    "heading",
    "img",
    "link",
    "list",
    "listbox",
    "listitem",
    "log",
    "main",
    "marquee",
    "math",
    "menu",
    "menubar",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "navigation",
    "none",
    "note",
    "option",
    "presentation",
    "progressbar",
    "radio",
    "radiogroup",
    "region",
    "row",
    "rowgroup",
    "rowheader",
    "scrollbar",
    "search",
    "searchbox",
    "separator",
    "slider",
    "spinbutton",
    "status",
    "switch",
    "tab",
    "table",
    "tablist",
    "tabpanel",
    "term",
    "textbox",
    "timer",
    "toolbar",
    "tooltip",
    "tree",
    "treegrid",
    "treeitem",
  ]

  return validRoles.includes(role)
}
