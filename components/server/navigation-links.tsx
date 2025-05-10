import type { LucideIcon } from "lucide-react"

// Define the navigation item type
export interface NavItem {
  name: string
  href: string
  icon?: LucideIcon
  isActive?: boolean
}

// Define the navigation section type
export interface NavSection {
  title?: string
  items: NavItem[]
}

interface NavigationLinksProps {
  sections: NavSection[]
}

export function NavigationLinks({ sections }: NavigationLinksProps) {
  return (
    <div className="space-y-6">
      {sections.map((section, i) => (
        <div key={section.title || `section-${i}`} className="space-y-2">
          {section.title && (
            <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{section.title}</h3>
          )}
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.name}>
                {/* We don't add interactivity here - that will be handled by the client component */}
                <div
                  data-href={item.href}
                  data-active={item.isActive ? "true" : "false"}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md"
                >
                  {item.icon && <item.icon className="h-5 w-5" aria-hidden="true" />}
                  {item.name}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
