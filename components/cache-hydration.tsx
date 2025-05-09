"use client"

import { useEffect, useState } from "react"

export function CacheHydration() {
  const [hydrationScript, setHydrationScript] = useState<string>("")

  useEffect(() => {
    // This component only runs on the client, so we don't need to worry about
    // server-side hydration issues
    const scriptElement = document.getElementById("__ISOMORPHIC_CACHE_DATA__")
    if (scriptElement) {
      try {
        const cacheData = JSON.parse(scriptElement.textContent || "{}")
        window.__ISOMORPHIC_CACHE_DATA__ = cacheData
      } catch (e) {
        console.error("Failed to hydrate isomorphic cache:", e)
      }
    }
  }, [])

  return null
}
