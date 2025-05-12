export function getCategoryColorKey(id: string): string {
  const lowerCaseId = id.toLowerCase()

  if (lowerCaseId.includes("faith")) {
    return "blue"
  } else if (lowerCaseId.includes("life")) {
    return "yellow"
  } else if (lowerCaseId.includes("work")) {
    return "red"
  } else if (lowerCaseId.includes("health")) {
    return "pink"
  } else if (lowerCaseId.includes("mind")) {
    return "purple"
  } else if (lowerCaseId.includes("learn")) {
    return "indigo"
  } else if (lowerCaseId.includes("relation")) {
    return "pink"
  } else {
    return "slate"
  }
}

export function getBaseColor(color: string): string {
  return color.split("-")[0]
}

export function getColorShade(color: string): string {
  return color.split("-")[1] || "500"
}

export function getHeaderBackgroundClasses(id: string, color: string): string {
  return `bg-${color}-600 text-white`
}

export function getHeaderTextClasses(id: string, color: string): string {
  return `text-${color}-600`
}

export function getProgressClasses(id: string, color: string): string {
  return `bg-${color}-500`
}

/**
 * Gets color class for a category based on its color key
 * @param colorKey The color key (e.g., 'blue', 'red')
 * @param type Optional type of class (bg, text, etc). Defaults to 'bg'
 * @returns A Tailwind CSS class string
 */
export function getCategoryColorClass(colorKey: string, type = "bg"): string {
  // If colorKey already includes a type prefix (like 'bg-blue'), return it
  if (colorKey.includes("-")) {
    return colorKey
  }

  return `${type}-${colorKey}-600`
}
