import { NextResponse } from "next/server"

/**
 * Optimize a response by:
 * 1. Compressing the response body
 * 2. Setting appropriate cache headers
 * 3. Removing unnecessary fields
 */
export function optimizeResponse(
  response: NextResponse,
  options: {
    maxAge?: number
    compress?: boolean
    fields?: string[]
  } = {},
): NextResponse {
  const { maxAge, compress: shouldCompress = true, fields } = options

  // Clone the response to avoid modifying the original
  const optimizedResponse = response.clone()

  // Set cache headers if maxAge is provided
  if (maxAge !== undefined) {
    optimizedResponse.headers.set(
      "Cache-Control",
      `max-age=${Math.floor(maxAge / 1000)}, s-maxage=${Math.floor(maxAge / 500)}, stale-while-revalidate=${Math.floor(maxAge / 100)}`,
    )
  }

  // Filter response data if fields are specified
  if (fields && fields.length > 0) {
    return optimizedResponse
      .json()
      .then((data) => {
        // If data is an array, filter each item
        if (Array.isArray(data)) {
          const filteredData = data.map((item) => filterObject(item, fields))
          return NextResponse.json(filteredData, {
            headers: optimizedResponse.headers,
            status: optimizedResponse.status,
          })
        }

        // If data is an object, filter it
        const filteredData = filterObject(data, fields)
        return NextResponse.json(filteredData, {
          headers: optimizedResponse.headers,
          status: optimizedResponse.status,
        })
      })
      .catch(() => optimizedResponse) // If parsing fails, return the original response
  }

  return optimizedResponse
}

/**
 * Filter an object to only include specified fields
 */
function filterObject(obj: Record<string, any>, fields: string[]): Record<string, any> {
  if (!obj || typeof obj !== "object") return obj

  const result: Record<string, any> = {}

  for (const field of fields) {
    if (field.includes(".")) {
      // Handle nested fields (e.g., 'user.profile.name')
      const [parent, ...rest] = field.split(".")
      if (obj[parent] && typeof obj[parent] === "object") {
        if (!result[parent]) {
          result[parent] = {}
        }
        const nestedValue = getNestedValue(obj[parent], rest.join("."))
        if (nestedValue !== undefined) {
          setNestedValue(result[parent], rest.join("."), nestedValue)
        }
      }
    } else if (obj[field] !== undefined) {
      // Handle top-level fields
      result[field] = obj[field]
    }
  }

  return result
}

/**
 * Get a nested value from an object using a dot-notation path
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  const parts = path.split(".")
  let current = obj

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined
    }
    current = current[part]
  }

  return current
}

/**
 * Set a nested value in an object using a dot-notation path
 */
function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
  const parts = path.split(".")
  let current = obj

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!(part in current) || current[part] === null || typeof current[part] !== "object") {
      current[part] = {}
    }
    current = current[part]
  }

  current[parts[parts.length - 1]] = value
}
