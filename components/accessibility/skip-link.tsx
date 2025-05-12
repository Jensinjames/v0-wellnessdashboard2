import type React from "react"

interface SkipLinkProps {
  href?: string
  children?: React.ReactNode
}

export function SkipLink({ href = "#main-content", children = "Skip to content" }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="absolute left-[-9999px] top-4 z-50 bg-background px-4 py-2 text-sm font-medium text-foreground focus:left-4"
    >
      {children}
    </a>
  )
}
