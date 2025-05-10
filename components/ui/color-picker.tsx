"use client"

import type * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

// Define the available colors with their display names and Tailwind class names
export const availableColors = [
  { name: "Slate", value: "slate" },
  { name: "Gray", value: "gray" },
  { name: "Zinc", value: "zinc" },
  { name: "Neutral", value: "neutral" },
  { name: "Stone", value: "stone" },
  { name: "Red", value: "red" },
  { name: "Orange", value: "orange" },
  { name: "Amber", value: "amber" },
  { name: "Yellow", value: "yellow" },
  { name: "Lime", value: "lime" },
  { name: "Green", value: "green" },
  { name: "Emerald", value: "emerald" },
  { name: "Teal", value: "teal" },
  { name: "Cyan", value: "cyan" },
  { name: "Sky", value: "sky" },
  { name: "Blue", value: "blue" },
  { name: "Indigo", value: "indigo" },
  { name: "Violet", value: "violet" },
  { name: "Purple", value: "purple" },
  { name: "Fuchsia", value: "fuchsia" },
  { name: "Pink", value: "pink" },
  { name: "Rose", value: "rose" },
]

export interface ColorPickerProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  onChange: (value: string) => void
  colors?: Array<{ name: string; value: string }>
  showColorNames?: boolean
  columns?: number
}

export function ColorPicker({
  value,
  onChange,
  colors = availableColors,
  showColorNames = false,
  columns = 6,
  className,
  ...props
}: ColorPickerProps) {
  return (
    <div
      className={cn("color-picker", className)}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: "0.5rem",
      }}
      role="radiogroup"
      aria-label="Select a color"
      {...props}
    >
      {colors.map((color) => {
        const isSelected = value === color.value
        const colorId = `color-${color.value}`

        return (
          <div key={color.value} className="flex flex-col items-center">
            <button
              type="button"
              id={colorId}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center border-2",
                `bg-${color.value}-500`,
                isSelected
                  ? `border-${color.value}-700 dark:border-${color.value}-300 ring-2 ring-${color.value}-500 ring-opacity-50`
                  : "border-transparent hover:border-gray-300 dark:hover:border-gray-600",
              )}
              onClick={() => onChange(color.value)}
              aria-checked={isSelected}
              aria-label={`${color.name} color`}
              role="radio"
            >
              {isSelected && <Check className="h-4 w-4 text-white" />}
              <VisuallyHidden>{color.name}</VisuallyHidden>
            </button>

            {showColorNames && <span className="mt-1 text-xs text-center">{color.name}</span>}
          </div>
        )
      })}
    </div>
  )
}
