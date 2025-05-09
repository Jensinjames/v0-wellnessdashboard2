// This file is simplified for production
export function getDebugSettings(): any {
  return {
    all: false,
    auth: false,
    supabase: false,
    api: false,
    cache: false,
    performance: false,
    ui: false,
  }
}

export function setDebugMode(enabled: boolean, namespace = "all"): void {
  // No-op in production
  if (process.env.NODE_ENV === "production") return
}

export function debugLog(namespace: string, ...args: any[]): void {
  // No-op in production
  if (process.env.NODE_ENV === "production") return
}

export function initializeDebugSettings(): void {
  // No-op in production
  if (process.env.NODE_ENV === "production") return
}
