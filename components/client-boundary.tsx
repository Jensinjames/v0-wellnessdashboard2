"use client"

import type { ReactNode } from "react"

export function ClientBoundary({ children }: { children: ReactNode }) {
  return <>{children}</>
}
