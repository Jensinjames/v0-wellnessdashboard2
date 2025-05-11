"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { safeCn, conditionalCn, variantCn, colorCn, responsiveCn } from "@/utils/safe-class-names"

export default function SafeClassNamesDemo() {
  const [isActive, setIsActive] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<"primary" | "secondary" | "danger">("primary")
  const [selectedColor, setSelectedColor] = useState("green")

  // Define variants
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600",
  }

  // Colors for demo
  const colors = ["red", "green", "blue", "purple", "yellow", "orange"]

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Safe Class Names Utility Demo</CardTitle>
        <CardDescription>Demonstrates the various ways to safely generate dynamic class names</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Conditional Classes Demo */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Conditional Classes</h3>
          <div className="flex items-center gap-4">
            <div
              className={conditionalCn("p-4 rounded-md transition-all duration-200", {
                "bg-green-500 text-white": isActive,
                "bg-gray-200 text-gray-700": !isActive,
                "shadow-md": isActive,
              })}
            >
              {isActive ? "Active State" : "Inactive State"}
            </div>
            <Button onClick={() => setIsActive(!isActive)}>Toggle Active</Button>
          </div>
        </div>

        {/* Variant Classes Demo */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Variant Classes</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(variants) as Array<keyof typeof variants>).map((variant) => (
              <button
                key={variant}
                className={safeCn(
                  "px-4 py-2 rounded-md transition-all",
                  variantCn(variants, variant),
                  selectedVariant === variant && "ring-2 ring-offset-2 ring-blue-400",
                )}
                onClick={() => setSelectedVariant(variant)}
              >
                {variant.charAt(0).toUpperCase() + variant.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Color Utility Demo */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Color Utility</h3>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                className={safeCn(
                  "px-4 py-2 rounded-md transition-all",
                  colorCn("bg", color),
                  colorCn("text", color === "yellow" ? "black" : "white"),
                  selectedColor === color && "ring-2 ring-offset-2 ring-blue-400",
                )}
                onClick={() => setSelectedColor(color)}
              >
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Classes Demo */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Responsive Classes</h3>
          <div
            className={responsiveCn("p-4 bg-red-500 text-white text-sm rounded-md", {
              sm: "bg-orange-500 text-base",
              md: "bg-yellow-500 text-black text-lg",
              lg: "bg-green-500 text-xl",
              xl: "bg-blue-500 text-2xl",
            })}
          >
            Resize the window to see this element change
          </div>
        </div>

        {/* Enhanced Button Demo */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Enhanced Button with Safe Classes</h3>
          <div className="flex flex-wrap gap-2">
            <EnhancedButton variant="default" icon="Activity">
              Activity
            </EnhancedButton>
            <EnhancedButton variant="secondary" icon="Brain">
              Brain
            </EnhancedButton>
            <EnhancedButton variant="outline" icon="Heart">
              Heart
            </EnhancedButton>
            <EnhancedButton variant="destructive" icon="Plus" iconPosition="right">
              Add
            </EnhancedButton>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
