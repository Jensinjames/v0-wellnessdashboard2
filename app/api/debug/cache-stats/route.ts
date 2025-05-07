import { NextResponse } from "next/server"
import { isProduction } from "@/lib/env-utils"

export async function GET() {
  // Don't expose cache stats in production
  if (isProduction()) {
    return NextResponse.json({ error: "Cache stats are not available in production" }, { status: 403 })
  }

  // Mock cache stats for demonstration
  const cacheStats = {
    hits: 150,
    misses: 45,
    size: 32, // number of items
    maxSize: 100,
    avgTtl: 300, // seconds
    oldestItem: new Date(Date.now() - 3600000).toISOString(),
    newestItem: new Date().toISOString(),
    evictions: 12,
  }

  return NextResponse.json(cacheStats)
}
