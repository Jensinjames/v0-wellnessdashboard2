"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3 } from "lucide-react"

interface GoalVisualizationLinkProps {
  className?: string
}

export function GoalVisualizationLink({ className }: GoalVisualizationLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === "/goal-visualization"

  return (
    <Link
      href="/goal-visualization"
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <BarChart3 className="h-4 w-4" />
      <span>Goal Visualization</span>
    </Link>
  )
}
