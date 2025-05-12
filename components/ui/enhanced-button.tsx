import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { safeCn } from "@/utils/safe-class-names"
import { buttonVariants as themeButtonVariants } from "@/lib/theme-config"

// Import specific icons we need instead of the entire library
import { ChevronDown, ChevronUp, Plus, Heart, Activity, Brain, Coffee, Briefcase, BookOpen, Users } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: safeCn(themeButtonVariants.primary.light, "dark:" + themeButtonVariants.primary.dark),
        destructive: safeCn(themeButtonVariants.destructive.light, "dark:" + themeButtonVariants.destructive.dark),
        outline: safeCn(themeButtonVariants.outline.light, "dark:" + themeButtonVariants.outline.dark),
        secondary: safeCn(themeButtonVariants.secondary.light, "dark:" + themeButtonVariants.secondary.dark),
        ghost: safeCn(themeButtonVariants.ghost.light, "dark:" + themeButtonVariants.ghost.dark),
        link: "text-primary underline-offset-4 hover:underline",
        success: safeCn(themeButtonVariants.success.light, "dark:" + themeButtonVariants.success.dark),
        warning: safeCn(themeButtonVariants.warning.light, "dark:" + themeButtonVariants.warning.dark),
        info: safeCn(themeButtonVariants.info.light, "dark:" + themeButtonVariants.info.dark),
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: string
  iconPosition?: "left" | "right"
  loading?: boolean
  loadingText?: string
  iconLabel?: string // New prop for icon accessibility
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      icon,
      iconPosition = "left",
      loading = false,
      loadingText,
      iconLabel,
      children,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button"
    const content = loading ? loadingText || children : children

    // If this is an icon-only button without text content, ensure it has an aria-label
    const hasTextContent = React.Children.toArray(children).some(
      (child) => typeof child === "string" || typeof child === "number",
    )

    const isIconOnly = size === "icon" || (!hasTextContent && icon)

    // Determine the appropriate aria-label
    const buttonAriaLabel = ariaLabel || (isIconOnly ? iconLabel || `${icon} button` : undefined)

    // Safely render icon as a component
    const renderIcon = () => {
      if (!icon) return null

      // Map string icon names to actual components
      switch (icon) {
        case "ChevronDown":
          return <ChevronDown className="h-4 w-4" aria-hidden="true" />
        case "ChevronUp":
          return <ChevronUp className="h-4 w-4" aria-hidden="true" />
        case "Plus":
          return <Plus className="h-4 w-4" aria-hidden="true" />
        case "Heart":
          return <Heart className="h-4 w-4" aria-hidden="true" />
        case "Activity":
          return <Activity className="h-4 w-4" aria-hidden="true" />
        case "Brain":
          return <Brain className="h-4 w-4" aria-hidden="true" />
        case "Coffee":
          return <Coffee className="h-4 w-4" aria-hidden="true" />
        case "Briefcase":
          return <Briefcase className="h-4 w-4" aria-hidden="true" />
        case "BookOpen":
          return <BookOpen className="h-4 w-4" aria-hidden="true" />
        case "Users":
          return <Users className="h-4 w-4" aria-hidden="true" />
        default:
          return null
      }
    }

    // Get the icon element
    const iconElement = renderIcon()

    // Use conditionalCn for dynamic classes
    const buttonClasses = safeCn(buttonVariants({ variant, size, className }))

    return (
      <Comp
        className={buttonClasses}
        ref={ref}
        disabled={props.disabled || loading}
        aria-busy={loading}
        aria-label={buttonAriaLabel}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}

        {!loading && icon && iconPosition === "left" && iconElement}

        {content}

        {!loading && icon && iconPosition === "right" && iconElement}

        {/* Add visually hidden text for screen readers if this is an icon-only button without an aria-label */}
        {isIconOnly && !buttonAriaLabel && icon && <span className="sr-only">{iconLabel || icon}</span>}
      </Comp>
    )
  },
)
EnhancedButton.displayName = "EnhancedButton"

export { EnhancedButton, buttonVariants }
