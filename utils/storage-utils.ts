// Convert from default export to named exports

export function saveToStorage<T>(key: string, value: T): void {
  try {
    if (typeof window !== "undefined") {
      const serialized = JSON.stringify(value)
      localStorage.setItem(key, serialized)
    }
  } catch (error) {
    console.error(`Error saving to localStorage (key: ${key}):`, error)
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window !== "undefined") {
      const serialized = localStorage.getItem(key)
      if (serialized === null) {
        return defaultValue
      }
      return JSON.parse(serialized) as T
    }
    return defaultValue
  } catch (error) {
    console.error(`Error loading from localStorage (key: ${key}):`, error)
    return defaultValue
  }
}

export function removeFromStorage(key: string): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key)
    }
  } catch (error) {
    console.error(`Error removing from localStorage (key: ${key}):`, error)
  }
}

export function clearStorage(): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.clear()
    }
  } catch (error) {
    console.error("Error clearing localStorage:", error)
  }
}

export function getStorageKeys(): string[] {
  try {
    if (typeof window !== "undefined") {
      return Object.keys(localStorage)
    }
    return []
  } catch (error) {
    console.error("Error getting localStorage keys:", error)
    return []
  }
}

export function getStorageSize(): number {
  try {
    if (typeof window !== "undefined") {
      let size = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key) || ""
          size += key.length + value.length
        }
      }
      return size
    }
    return 0
  } catch (error) {
    console.error("Error calculating localStorage size:", error)
    return 0
  }
}
