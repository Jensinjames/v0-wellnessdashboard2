import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Heart, Activity, Brain, Coffee, Briefcase, BookOpen, Users, Sun, Leaf } from "lucide-react"

export interface CategoryIconProps {
  categoryId: string
  icon: string
  size?: "xs" | "sm" | "md" | "lg"
  label: string
  color?: string
  shade?: string
  background?: string
}

export function CategoryIcon({
  categoryId,
  icon,
  size = "md",
  label,
  color = "blue",
  shade = "500",
  background,
}: CategoryIconProps) {
  // Size classes
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  // Container size classes
  const containerSizeClasses = {
    xs: "h-5 w-5",
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }

  // Process color if it contains a shade
  if (color.includes("-")) {
    const parts = color.split("-")
    color = parts[0]
    shade = parts[1]
  }

  // Render the appropriate icon based on the icon name
  const renderIcon = () => {
    switch (icon) {
      case "Heart":
        return <Heart className={cn(sizeClasses[size])} aria-hidden="true" />
      case "Activity":
        return <Activity className={cn(sizeClasses[size])} aria-hidden="true" />
      case "Brain":
        return <Brain className={cn(sizeClasses[size])} aria-hidden="true" />
      case "Coffee":
        return <Coffee className={cn(sizeClasses[size])} aria-hidden="true" />
      case "Briefcase":
        return <Briefcase className={cn(sizeClasses[size])} aria-hidden="true" />
      case "BookOpen":
        return <BookOpen className={cn(sizeClasses[size])} aria-hidden="true" />
      case "Users":
        return <Users className={cn(sizeClasses[size])} aria-hidden="true" />
      case "Sun":
        return <Sun className={cn(sizeClasses[size])} aria-hidden="true" />
      case "Leaf":
        return <Leaf className={cn(sizeClasses[size])} aria-hidden="true" />
      default:
        return <Activity className={cn(sizeClasses[size])} aria-hidden="true" />
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md",
        containerSizeClasses[size],
        background
          ? background
          : `bg-${color}-${shade} dark:bg-${color}-${Number.parseInt(shade) > 500 ? Number.parseInt(shade) - 100 : Number.parseInt(shade) + 100}`,
      )}
    >
      <div className={cn("text-white", Number.parseInt(shade) < 500 ? "text-gray-800" : "text-white")}>
        {renderIcon()}
      </div>
      <VisuallyHidden>{label}</VisuallyHidden>
    </div>
  )
}
