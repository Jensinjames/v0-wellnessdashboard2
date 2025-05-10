"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ColorPicker } from "./color-picker"
import { Label } from "./label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { Slider } from "./slider"

export interface CategoryColorPickerProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  onChange: (value: string) => void
  showPreview?: boolean
}

export function CategoryColorPicker({
  value,
  onChange,
  showPreview = true,
  className,
  ...props
}: CategoryColorPickerProps) {
  // Extract the base color and shade (if any)
  const [baseColor, shade] = React.useMemo(() => {
    const parts = value.split("-")
    if (parts.length === 1) {
      return [parts[0], "500"]
    }
    return [parts[0], parts[1]]
  }, [value])

  // Handle base color change
  const handleBaseColorChange = (newBaseColor: string) => {
    onChange(`${newBaseColor}-${shade}`)
  }

  // Handle shade change
  const handleShadeChange = (newShade: string) => {
    onChange(`${baseColor}-${newShade}`)
  }

  // Available shades
  const shades = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"]

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="space-y-2">
        <Label>Select Color</Label>
        <ColorPicker value={baseColor} onChange={handleBaseColorChange} />
      </div>

      <div className="space-y-2">
        <Label>Intensity</Label>
        <Tabs defaultValue="slider" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="slider">Slider</TabsTrigger>
            <TabsTrigger value="swatches">Swatches</TabsTrigger>
          </TabsList>

          <TabsContent value="slider" className="pt-2">
            <Slider
              min={0}
              max={9}
              step={1}
              value={[shades.indexOf(shade)]}
              onValueChange={(values) => {
                handleShadeChange(shades[values[0]])
              }}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Lighter</span>
              <span>Darker</span>
            </div>
          </TabsContent>

          <TabsContent value="swatches" className="pt-2">
            <div className="grid grid-cols-5 gap-2">
              {shades.map((shadeValue) => {
                const isSelected = shade === shadeValue
                return (
                  <button
                    key={shadeValue}
                    type="button"
                    className={cn(
                      "h-8 rounded flex items-center justify-center border-2",
                      `bg-${baseColor}-${shadeValue}`,
                      isSelected
                        ? `border-${baseColor}-${Number.parseInt(shadeValue) > 500 ? "300" : "700"} ring-2 ring-${baseColor}-500 ring-opacity-50`
                        : "border-transparent hover:border-gray-300 dark:hover:border-gray-600",
                    )}
                    onClick={() => handleShadeChange(shadeValue)}
                    aria-label={`${baseColor} ${shadeValue} intensity`}
                  >
                    <span
                      className={cn(
                        "text-xs font-medium",
                        Number.parseInt(shadeValue) > 500 ? "text-white" : "text-black",
                      )}
                    >
                      {shadeValue}
                    </span>
                  </button>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showPreview && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="flex flex-col space-y-2">
            <div className={`h-12 rounded-md bg-${value} flex items-center justify-center`}>
              <span className={cn("font-medium", Number.parseInt(shade) > 500 ? "text-white" : "text-black")}>
                Category Title
              </span>
            </div>
            <div className="flex space-x-2">
              <div className={`h-8 w-8 rounded-full bg-${value} flex items-center justify-center`}>
                <span className={cn("text-xs font-bold", Number.parseInt(shade) > 500 ? "text-white" : "text-black")}>
                  Icon
                </span>
              </div>
              <div
                className={`flex-1 h-8 rounded-md bg-${baseColor}-100 dark:bg-${baseColor}-900 border border-${baseColor}-200 dark:border-${baseColor}-800`}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
