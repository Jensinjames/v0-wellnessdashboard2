"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

// Dynamically import the RedirectHandler with { ssr: false } to prevent server-side rendering
const RedirectHandler = dynamic(() => import("@/components/auth/redirect-handler").then((mod) => mod.RedirectHandler), {
  ssr: false,
  loading: () => null,
})

export default function VerifyEmailClient() {
  return (
    <Suspense fallback={null}>
      <RedirectHandler />
    </Suspense>
  )
}
