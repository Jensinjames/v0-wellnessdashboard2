import type React from "react"
import { cn } from "@/lib/utils"
import { statusColors } from "@/lib/theme-config"
import { AccessibleIcon } from "@/components/ui/accessible-icon"
import { Loader2 } from "lucide-react"

export type StatusType = "success" | "warning" | "error" | "info" | "loading"

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType
  message: string
  icon?: keyof typeof import("lucide-react")
  className?: string
  iconClassName?: string
}

export function StatusIndicator({ status, message, icon, className, iconClassName, ...props }: StatusIndicatorProps) {
  // Default icons for each status
  const defaultIcons = {
    success: "CheckCircle",
    warning: "AlertTriangle",
    error: "XCircle",
    info: "Info",
    loading: "Loader2",
  }

  const selectedIcon = icon || defaultIcons[status]

  // Get color classes based on status
  const getColorClasses = () => {
    if (status === "loading") {
      return {
        container: "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700",
        text: "text-slate-800 dark:text-slate-200",
        icon: "text-slate-600 dark:text-slate-400",
      }
    }

    const statusColor = statusColors[status === "loading" ? "info" : status]
    return {
      container: `${statusColor.light.bg} ${statusColor.light.border} dark:${statusColor.dark.bg} dark:${statusColor.dark.border}`,
      text: `${statusColor.light.text} dark:${statusColor.dark.text}`,
      icon: `${statusColor.light.icon} dark:${statusColor.dark.icon}`,
    }
  }

  const colorClasses = getColorClasses()

  return (
    <div
      className={cn("flex items-center gap-2 rounded-md border p-3", colorClasses.container, className)}
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      {...props}
    >
      {status === "loading" ? (
        <Loader2 className={cn("h-5 w-5 animate-spin", colorClasses.icon, iconClassName)} aria-hidden="true" />
      ) : (
        <AccessibleIcon
          name={selectedIcon as any}
          className={cn(colorClasses.icon, iconClassName)}
          aria-hidden="true"
        />
      )}
      <span className={cn("text-sm font-medium", colorClasses.text)}>{message}</span>
    </div>
  )
}
