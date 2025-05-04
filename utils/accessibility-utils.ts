/**
 * Utility functions for accessibility
 */

/**
 * Generates a unique ID with an optional prefix
 * @param prefix Optional prefix for the ID
 * @returns A unique ID string
 */
export function generateUniqueId(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Calculates the contrast ratio between two colors
 * @param foreground The foreground color in hex format (e.g., "#ffffff")
 * @param background The background color in hex format (e.g., "#000000")
 * @returns The contrast ratio as a number
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  // Convert hex to RGB
  const hexToRgb = (hex: string): number[] => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b)
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex)
    return result
      ? [Number.parseInt(result[1], 16), Number.parseInt(result[2], 16), Number.parseInt(result[3], 16)]
      : [0, 0, 0]
  }

  // Calculate relative luminance
  const calculateLuminance = (rgb: number[]): number => {
    const [r, g, b] = rgb.map((c) => {
      const channel = c / 255
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const foregroundRgb = hexToRgb(foreground)
  const backgroundRgb = hexToRgb(background)

  const foregroundLuminance = calculateLuminance(foregroundRgb)
  const backgroundLuminance = calculateLuminance(backgroundRgb)

  // Calculate contrast ratio
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Checks if a contrast ratio meets WCAG AA standards
 * @param ratio The contrast ratio to check
 * @param isLargeText Whether the text is large (14pt bold or 18pt regular)
 * @returns True if the contrast ratio meets WCAG AA standards
 */
export function meetsWcagAA(ratio: number, isLargeText = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Checks if a contrast ratio meets WCAG AAA standards
 * @param ratio The contrast ratio to check
 * @param isLargeText Whether the text is large (14pt bold or 18pt regular)
 * @returns True if the contrast ratio meets WCAG AAA standards
 */
export function meetsWcagAAA(ratio: number, isLargeText = false): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}

/**
 * Announces a message to screen readers
 * @param message The message to announce
 * @param assertive Whether the message should be announced assertively
 */
export function announceToScreenReader(message: string, assertive = false): void {
  if (typeof document === "undefined") return // SSR check

  // Create or get the live region
  const liveRegionId = assertive ? "screen-reader-assertive-announce" : "screen-reader-polite-announce"

  let liveRegion = document.getElementById(liveRegionId)

  if (!liveRegion) {
    liveRegion = document.createElement("div")
    liveRegion.id = liveRegionId
    liveRegion.setAttribute("aria-live", assertive ? "assertive" : "polite")
    liveRegion.setAttribute("aria-atomic", "true")
    liveRegion.className = "sr-only"
    document.body.appendChild(liveRegion)
  }

  // Clear the region first to ensure the announcement
  liveRegion.textContent = ""

  // Set the message after a brief delay
  setTimeout(() => {
    liveRegion!.textContent = message
  }, 100)
}

/**
 * Focuses the first focusable element in a container
 * @param containerId The ID of the container element
 */
export function focusFirstElement(containerId: string): void {
  if (typeof document === "undefined") return // SSR check

  const container = document.getElementById(containerId)
  if (!container) return

  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )

  if (focusableElements.length > 0) {
    ;(focusableElements[0] as HTMLElement).focus()
  }
}

/**
 * Traps focus within a container
 * @param containerId The ID of the container element
 * @returns A cleanup function to remove the trap
 */
export function trapFocus(containerId: string): () => void {
  if (typeof document === "undefined") return () => {} // SSR check

  const container = document.getElementById(containerId)
  if (!container) return () => {}

  const focusableElements = Array.from(
    container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
  ) as HTMLElement[]

  if (focusableElements.length === 0) return () => {}

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return

    if (e.shiftKey) {
      // Shift + Tab: if focus is on first element, move to last
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab: if focus is on last element, move to first
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  document.addEventListener("keydown", handleKeyDown)

  // Return cleanup function
  return () => {
    document.removeEventListener("keydown", handleKeyDown)
  }
}
