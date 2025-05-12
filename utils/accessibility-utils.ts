/**
 * Utility functions for accessibility
 */

/**
 * Determines if an element is focusable
 * @param element The element to check
 * @returns Boolean indicating if the element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  // Elements that are naturally focusable
  const focusableElements = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
    "area[href]",
    "iframe",
    "object",
    "embed",
    "audio[controls]",
    "video[controls]",
  ]

  // Check if the element matches any of the focusable selectors
  return focusableElements.some((selector) => element.matches(selector))
}

/**
 * Ensures that elements with aria-hidden="true" don't contain focusable elements
 * @param rootElement The root element to check (usually document.body)
 * @returns Array of accessibility issues
 */
export function checkAriaHiddenFocusable(rootElement: HTMLElement = document.body): string[] {
  const issues: string[] = []

  // Find all elements with aria-hidden="true"
  const hiddenElements = Array.from(rootElement.querySelectorAll('[aria-hidden="true"]'))

  hiddenElements.forEach((hiddenElement) => {
    // Check if the hidden element itself is focusable
    if (isFocusable(hiddenElement as HTMLElement)) {
      issues.push(`Element with aria-hidden="true" is focusable: ${getElementIdentifier(hiddenElement)}`)
    }

    // Check if it contains any focusable descendants
    const focusableDescendants = Array.from(hiddenElement.querySelectorAll("*")).filter((el) =>
      isFocusable(el as HTMLElement),
    )

    if (focusableDescendants.length > 0) {
      focusableDescendants.forEach((el) => {
        issues.push(`Element with aria-hidden="true" contains focusable descendant: ${getElementIdentifier(el)}`)
      })
    }
  })

  return issues
}

/**
 * Gets a string identifier for an element
 * @param element The element to identify
 * @returns A string identifying the element
 */
function getElementIdentifier(element: Element): string {
  let identifier = element.tagName.toLowerCase()

  if (element.id) {
    identifier += `#${element.id}`
  }

  if (element.className && typeof element.className === "string") {
    const classes = element.className.split(" ").filter(Boolean).join(".")
    if (classes) {
      identifier += `.${classes}`
    }
  }

  return identifier
}

/**
 * Checks that lists (ul/ol) only directly contain li elements
 * @param rootElement The root element to check (usually document.body)
 * @returns Array of accessibility issues
 */
export function checkListStructure(rootElement: HTMLElement = document.body): string[] {
  const issues: string[] = []

  // Find all ul and ol elements
  const listElements = Array.from(rootElement.querySelectorAll("ul, ol"))

  listElements.forEach((list) => {
    // Get all direct children
    const children = Array.from(list.children)

    // Check if any direct children are not li, script, or template
    const invalidChildren = children.filter((child) => {
      const tagName = child.tagName.toLowerCase()
      return tagName !== "li" && tagName !== "script" && tagName !== "template"
    })

    if (invalidChildren.length > 0) {
      invalidChildren.forEach((child) => {
        issues.push(
          `List element contains invalid direct child: ${getElementIdentifier(list)} > ${getElementIdentifier(child)}`,
        )
      })
    }
  })

  return issues
}

/**
 * Ensures that elements have appropriate ARIA labels
 * @param rootElement The root element to check
 * @returns Array of accessibility issues
 */
export function checkAriaLabels(rootElement: HTMLElement = document.body): string[] {
  const issues: string[] = []

  // Elements that should have accessible names
  const elementsRequiringLabels = [
    "a[href]",
    "button",
    "input",
    "select",
    "textarea",
    '[role="button"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="tab"]',
    '[role="menuitem"]',
  ]

  const selector = elementsRequiringLabels.join(",")
  const elements = Array.from(rootElement.querySelectorAll(selector))

  elements.forEach((element) => {
    const hasAccessibleName =
      element.hasAttribute("aria-label") ||
      element.hasAttribute("aria-labelledby") ||
      (element as HTMLElement).innerText?.trim() ||
      element.getAttribute("title") ||
      element.getAttribute("alt") ||
      (element.tagName.toLowerCase() === "input" &&
        element.getAttribute("type") === "button" &&
        element.getAttribute("value"))

    if (!hasAccessibleName) {
      issues.push(`Element missing accessible name: ${getElementIdentifier(element)}`)
    }
  })

  return issues
}

/**
 * Generates a unique ID for accessibility purposes
 *
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID
 */
export function generateUniqueId(prefix?: string): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
