import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Heart, Activity, Brain, Coffee, Briefcase, BookOpen, Users } from "lucide-react"

interface CategoryIconProps {
  categoryId: string
  icon: string
  size?: "xs" | "sm" | "md" | "lg"
  label: string
  color?: string
  background?: string
}

export function CategoryIcon({ categoryId, icon, size = "md", label, color = "blue", background }: CategoryIconProps) {
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
      default:
        return <Activity className={cn(sizeClasses[size])} aria-hidden="true" />
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md",
        containerSizeClasses[size],
        background ? background : `bg-${color}-600 dark:bg-${color}-500`,
      )}
    >
      <div className="text-white">{renderIcon()}</div>
      <VisuallyHidden>{label}</VisuallyHidden>
    </div>
  )
}
