"use client"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"

interface BreadcrumbProps {
  homeHref?: string
  items?: Array<{
    label: string
    href?: string
  }>
  className?: string
}

export function Breadcrumb({ homeHref = "/dashboard", items = [], className = "" }: BreadcrumbProps) {
  const pathname = usePathname()

  // If no items are provided, generate them from the pathname
  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbItems(pathname)

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-sm text-muted-foreground ${className}`}>
      <ol className="flex items-center space-x-2">
        <li>
          <Link href={homeHref} className="flex items-center hover:text-foreground transition-colors" aria-label="Home">
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {breadcrumbItems.map((item, index) => (
          <Fragment key={index}>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4" />
            </li>
            <li>
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{item.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}

// Helper function to generate breadcrumb items from pathname
function generateBreadcrumbItems(pathname: string) {
  if (pathname === "/dashboard") return []

  const segments = pathname.split("/").filter(Boolean)

  return segments.map((segment, index) => {
    const href = index === segments.length - 1 ? undefined : `/${segments.slice(0, index + 1).join("/")}`

    return {
      label: formatSegment(segment),
      href,
    }
  })
}

// Helper function to format pathname segments
function formatSegment(segment: string) {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
