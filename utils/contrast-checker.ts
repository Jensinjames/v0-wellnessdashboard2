// Function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, "")

  // Parse hex values
  let r, g, b
  if (hex.length === 3) {
    // Short notation (#RGB)
    r = Number.parseInt(hex[0] + hex[0], 16)
    g = Number.parseInt(hex[1] + hex[1], 16)
    b = Number.parseInt(hex[2] + hex[2], 16)
  } else if (hex.length === 6) {
    // Long notation (#RRGGBB)
    r = Number.parseInt(hex.substring(0, 2), 16)
    g = Number.parseInt(hex.substring(2, 4), 16)
    b = Number.parseInt(hex.substring(4, 6), 16)
  } else {
    return null
  }

  return { r, g, b }
}

// Function to calculate relative luminance
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  // Convert RGB values to sRGB
  const sRGB = {
    r: rgb.r / 255,
    g: rgb.g / 255,
    b: rgb.b / 255,
  }

  // Calculate luminance
  const luminance = {
    r: sRGB.r <= 0.03928 ? sRGB.r / 12.92 : Math.pow((sRGB.r + 0.055) / 1.055, 2.4),
    g: sRGB.g <= 0.03928 ? sRGB.g / 12.92 : Math.pow((sRGB.g + 0.055) / 1.055, 2.4),
    b: sRGB.b <= 0.03928 ? sRGB.b / 12.92 : Math.pow((sRGB.b + 0.055) / 1.055, 2.4),
  }

  return 0.2126 * luminance.r + 0.7152 * luminance.g + 0.0722 * luminance.b
}

// Function to calculate contrast ratio
export function getContrastRatio(foreground: string, background: string): number {
  const fgRgb = hexToRgb(foreground)
  const bgRgb = hexToRgb(background)

  if (!fgRgb || !bgRgb) {
    throw new Error("Invalid color format. Use hex format (#RGB or #RRGGBB).")
  }

  const fgLuminance = getLuminance(fgRgb)
  const bgLuminance = getLuminance(bgRgb)

  // Calculate contrast ratio
  const lighter = Math.max(fgLuminance, bgLuminance)
  const darker = Math.min(fgLuminance, bgLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

// Function to check if contrast meets WCAG AA standards
export function meetsWcagAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background)
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

// Function to check if contrast meets WCAG AAA standards
export function meetsWcagAAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background)
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}

// Function to suggest a darker/lighter color to meet contrast requirements
export function suggestAccessibleColor(
  foreground: string,
  background: string,
  isLargeText = false,
  adjustForeground = true,
): string {
  const targetRatio = isLargeText ? 3 : 4.5
  const fgRgb = hexToRgb(foreground)
  const bgRgb = hexToRgb(background)

  if (!fgRgb || !bgRgb) {
    throw new Error("Invalid color format. Use hex format (#RGB or #RRGGBB).")
  }

  // Determine which color to adjust
  const colorToAdjust = adjustForeground ? fgRgb : bgRgb
  const otherColor = adjustForeground ? bgRgb : fgRgb

  // Calculate luminance
  const otherLuminance = getLuminance(otherColor)

  // Determine if we need to darken or lighten
  const shouldDarken = otherLuminance > 0.5

  // Adjust color until we meet the target ratio
  const step = shouldDarken ? -0.05 : 0.05
  const adjustedColor = { ...colorToAdjust }
  let currentRatio = getContrastRatio(
    rgbToHex(adjustForeground ? adjustedColor : fgRgb),
    rgbToHex(adjustForeground ? bgRgb : adjustedColor),
  )

  while (currentRatio < targetRatio) {
    // Adjust RGB values
    adjustedColor.r = Math.max(0, Math.min(255, adjustedColor.r + step * 255))
    adjustedColor.g = Math.max(0, Math.min(255, adjustedColor.g + step * 255))
    adjustedColor.b = Math.max(0, Math.min(255, adjustedColor.b + step * 255))

    // Recalculate ratio
    currentRatio = getContrastRatio(
      rgbToHex(adjustForeground ? adjustedColor : fgRgb),
      rgbToHex(adjustForeground ? bgRgb : adjustedColor),
    )

    // If we've reached the limit of adjustment and still don't meet the ratio
    if (
      (shouldDarken && adjustedColor.r <= 0 && adjustedColor.g <= 0 && adjustedColor.b <= 0) ||
      (!shouldDarken && adjustedColor.r >= 255 && adjustedColor.g >= 255 && adjustedColor.b >= 255)
    ) {
      break
    }
  }

  return rgbToHex(adjustedColor)
}

// Function to convert RGB to hex
function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  return (
    "#" +
    Math.round(rgb.r).toString(16).padStart(2, "0") +
    Math.round(rgb.g).toString(16).padStart(2, "0") +
    Math.round(rgb.b).toString(16).padStart(2, "0")
  )
}
