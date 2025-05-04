"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconPicker } from "@/components/ui/icon-picker"
import { AccessibleIcon } from "@/components/ui/accessible-icon"
import { cn } from "@/lib/utils"
import { iconColors, iconBackgroundColors, iconSizes } from "@/lib/theme-config"
import { useIconContext } from "@/context/icon-context"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface IconCustomizerProps {
  id: string
  initialIcon?: string
  initialColor?: string
  initialSize?: string
  initialBackground?: string
  onSave?: (id: string, icon: string, color: string, size: string, background?: string) => void
  onCancel?: () => void
  className?: string
}

export function IconCustomizer({
  id,
  initialIcon = "Activity",
  initialColor = "blue",
  initialSize = "md",
  initialBackground,
  onSave,
  onCancel,
  className,
}: IconCustomizerProps) {
  const [icon, setIcon] = useState(initialIcon)
  const [color, setColor] = useState(initialColor)
  const [size, setSize] = useState(initialSize)
  const [background, setBackground] = useState(initialBackground)
  const [customIconUrl, setCustomIconUrl] = useState("")
  const [activeTab, setActiveTab] = useState<string>("library")
  const { setIconPreference } = useIconContext()

  const handleSave = () => {
    // Save to context
    setIconPreference(id, {
      name: icon,
      color,
      size,
      background,
    })

    // Call onSave callback if provided
    if (onSave) {
      onSave(id, icon, color, size, background)
    }
  }

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle>Customize Icon</CardTitle>
        <CardDescription>Choose and customize an icon for this element</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Icon Library</TabsTrigger>
            <TabsTrigger value="custom">Custom Icon</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="icon-picker">Select Icon</Label>
              <IconPicker
                id="icon-picker"
                value={icon}
                onChange={setIcon}
                color={color}
                onColorChange={setColor}
                size={size}
                onSizeChange={setSize}
                background={background}
                onBackgroundChange={setBackground}
              />
            </div>

            <div className="pt-4">
              <Label>Preview</Label>
              <div className="mt-2 flex items-center justify-center p-6 border rounded-md">
                <div
                  className={cn(
                    "flex items-center justify-center rounded-md p-3",
                    background && iconBackgroundColors[background as keyof typeof iconBackgroundColors],
                  )}
                >
                  <AccessibleIcon
                    name={icon as any}
                    size={size}
                    className={iconColors[color as keyof typeof iconColors]}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="custom" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="custom-icon-url">Custom Icon URL</Label>
              <Input
                id="custom-icon-url"
                placeholder="https://example.com/icon.svg"
                value={customIconUrl}
                onChange={(e) => setCustomIconUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the URL of a custom SVG or PNG icon. The icon will be displayed at the selected size.
              </p>
            </div>

            {customIconUrl && (
              <div className="pt-4">
                <Label>Preview</Label>
                <div className="mt-2 flex items-center justify-center p-6 border rounded-md">
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-md p-3",
                      background && iconBackgroundColors[background as keyof typeof iconBackgroundColors],
                    )}
                  >
                    <img
                      src={customIconUrl || "/placeholder.svg"}
                      alt="Custom icon"
                      className={cn(iconSizes[size as keyof typeof iconSizes])}
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Cline x1='9' x2='15' y1='9' y2='15'/%3E%3Cline x1='15' x2='9' y1='9' y2='15'/%3E%3C/svg%3E"
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Icon</Button>
      </CardFooter>
    </Card>
  )
}
