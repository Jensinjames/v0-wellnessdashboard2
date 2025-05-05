"use client"

import type React from "react"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFormAccessibility } from "@/hooks/use-form-accessibility"

export function SearchForm({ className = "", ...props }: React.ComponentProps<"form">) {
  const { generateFieldId } = useFormAccessibility()
  const searchId = generateFieldId("search")

  return (
    <form className={`relative ${className}`} {...props}>
      <label htmlFor={searchId} className="sr-only">
        Search
      </label>
      <Input id={searchId} name="search" type="search" placeholder="Search..." className="pl-9" aria-label="Search" />
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
    </form>
  )
}
