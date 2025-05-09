"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { type NavSection, NavigationLinks } from "@/components/server/navigation-links"

interface NavigationClientProps {
  sections: NavSection[]
}

export function NavigationClient({ sections }: NavigationClientProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Process sections to mark active items based on current pathname
  const processedSections = sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      isActive: pathname === item.href,
    })),
  }))

  return (
    <div className="navigation-wrapper">
      <NavigationLinks sections={processedSections} />

      {/* Add client-side interactivity with event delegation */}
      <div
        className="navigation-interactivity"
        onClick={(e) => {
          // Use event delegation to handle clicks
          const target = e.target as HTMLElement
          const navItem = target.closest("[data-href]")

          if (navItem) {
            e.preventDefault()
            const href = navItem.getAttribute("data-href")
            if (href) {
              router.push(href)
            }
          }
        }}
      >
        {/* This div overlays the NavigationLinks to provide interactivity */}
        {processedSections.map((section, i) => (
          <div key={`interactive-${section.title || i}`} className="space-y-2">
            {section.title && <div className="h-5 mt-6 mb-2" />}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={`interactive-${item.name}`}>
                  <Link
                    href={item.href}
                    className={`block px-3 py-2 text-sm font-medium rounded-md ${
                      item.isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                    }`}
                    aria-current={item.isActive ? "page" : undefined}
                  >
                    <span className="sr-only">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
