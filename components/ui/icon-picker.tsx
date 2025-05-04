"use client"
import { useState, useEffect, useRef } from "react"
import * as LucideIcons from "lucide-react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AccessibleIcon } from "@/components/ui/accessible-icon"
import { cn } from "@/lib/utils"
import { iconColors, iconBackgroundColors, iconSizes } from "@/lib/theme-config"
import { useIconContext } from "@/context/icon-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Icon categories for organization
const iconCategories = {
  Recent: [],
  Common: [
    "Activity",
    "AlertCircle",
    "Archive",
    "ArrowRight",
    "Award",
    "Bell",
    "BookOpen",
    "Calendar",
    "Check",
    "ChevronDown",
    "Clock",
    "Edit",
    "FileText",
    "Filter",
    "Flag",
    "Heart",
    "Home",
    "Info",
    "Mail",
    "Map",
    "MessageSquare",
    "Moon",
    "MoreHorizontal",
    "Plus",
    "Search",
    "Settings",
    "Share",
    "ShoppingCart",
    "Star",
    "Sun",
    "Trash",
    "User",
  ],
  Arrows: [
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDownLeft",
    "ArrowDownRight",
    "ArrowUpLeft",
    "ArrowUpRight",
    "ChevronDown",
    "ChevronLeft",
    "ChevronRight",
    "ChevronUp",
    "ChevronsDown",
    "ChevronsLeft",
    "ChevronsRight",
    "ChevronsUp",
  ],
  Weather: [
    "Cloud",
    "CloudDrizzle",
    "CloudFog",
    "CloudLightning",
    "CloudRain",
    "CloudSnow",
    "Cloudy",
    "Sun",
    "Sunrise",
    "Sunset",
    "Wind",
  ],
  Health: ["Activity", "Heart", "HeartPulse", "Stethoscope", "Thermometer", "Pill", "Bike", "Dumbbell"],
  Communication: ["Mail", "MessageCircle", "MessageSquare", "Phone", "Send", "Share", "Share2", "Smartphone"],
  Files: [
    "File",
    "FileText",
    "FilePlus",
    "FileMinus",
    "FileCheck",
    "FileX",
    "FileInput",
    "FileOutput",
    "Folder",
    "FolderPlus",
    "FolderMinus",
    "FolderOpen",
  ],
}

// Available colors for icons
const availableColors = [
  { name: "Slate", value: "slate" },
  { name: "Gray", value: "gray" },
  { name: "Red", value: "red" },
  { name: "Orange", value: "orange" },
  { name: "Yellow", value: "yellow" },
  { name: "Green", value: "green" },
  { name: "Teal", value: "teal" },
  { name: "Blue", value: "blue" },
  { name: "Indigo", value: "indigo" },
  { name: "Purple", value: "purple" },
  { name: "Pink", value: "pink" },
]

// Available sizes for icons
const availableSizes = [
  { name: "Extra Small", value: "xs" },
  { name: "Small", value: "sm" },
  { name: "Medium", value: "md" },
  { name: "Large", value: "lg" },
  { name: "Extra Large", value: "xl" },
  { name: "2X Large", value: "2xl" },
]

export interface IconPickerProps {
  value: string
  onChange: (value: string) => void
  color?: string
  onColorChange?: (color: string) => void
  size?: string
  onSizeChange?: (size: string) => void
  background?: string
  onBackgroundChange?: (background: string) => void
  id?: string
  className?: string
  triggerClassName?: string
  contentClassName?: string
}

export function IconPicker({
  value,
  onChange,
  color = "blue",
  onColorChange,
  size = "md",
  onSizeChange,
  background,
  onBackgroundChange,
  id,
  className,
  triggerClassName,
  contentClassName,
}: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("Recent")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { recentlyUsedIcons, addToRecentlyUsed } = useIconContext()

  // Update Recent category with user's recently used icons
  useEffect(() => {
    iconCategories.Recent = recentlyUsedIcons
  }, [recentlyUsedIcons])

  // Focus search input when popover opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Get all available Lucide icons
  const allIcons = Object.keys(LucideIcons)
    .filter((key) => typeof LucideIcons[key as keyof typeof LucideIcons] === "function" && key !== "createLucideIcon")
    .sort()

  // Filter icons based on search query
  const filteredIcons = search ? allIcons.filter((icon) => icon.toLowerCase().includes(search.toLowerCase())) : []

  // Handle icon selection
  const handleSelectIcon = (iconName: string) => {
    onChange(iconName)
    addToRecentlyUsed(iconName)
    setOpen(false)
  }

  // Get icon component by name - FIXED: Return a proper JSX element
  const getIconByName = (name: string) => {
    const Icon = LucideIcons[name as keyof typeof LucideIcons]
    if (!Icon) return null
    return <Icon className={cn(iconSizes[size as keyof typeof iconSizes], "flex-shrink-0")} />
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select an icon"
          className={cn("w-full justify-between", triggerClassName)}
        >
          <div className="flex items-center gap-2">
            {value ? (
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  background && iconBackgroundColors[background as keyof typeof iconBackgroundColors],
                  iconColors[color as keyof typeof iconColors],
                )}
              >
                {getIconByName(value)}
              </div>
            ) : (
              <div className="h-8 w-8 rounded-md border border-dashed border-slate-300 flex items-center justify-center">
                <AccessibleIcon name="Image" size="sm" className="text-slate-400" />
              </div>
            )}
            <span className="truncate">{value || "Select an icon"}</span>
          </div>
          <AccessibleIcon name="ChevronDown" size="sm" className="ml-2 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[340px] p-0", contentClassName)}>
        <div className="flex flex-col h-[400px]">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search icons..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  if (e.target.value) {
                    setActiveTab("Search")
                  } else {
                    setActiveTab("Recent")
                  }
                }}
              />
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => {
                    setSearch("")
                    setActiveTab("Recent")
                    searchInputRef.current?.focus()
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b px-3">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="Recent" className="text-xs">
                  Recent
                </TabsTrigger>
                <TabsTrigger value="Common" className="text-xs">
                  Common
                </TabsTrigger>
                <TabsTrigger value="All" className="text-xs">
                  All
                </TabsTrigger>
                {search && (
                  <TabsTrigger value="Search" className="text-xs">
                    Search
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              {/* Recent Icons */}
              <TabsContent value="Recent" className="h-full">
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-6 gap-2 p-3">
                    {iconCategories.Recent.length > 0 ? (
                      iconCategories.Recent.map((icon) => (
                        <button
                          key={icon}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-md border border-transparent",
                            "hover:border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                            value === icon && "border-slate-200 bg-slate-100",
                          )}
                          onClick={() => handleSelectIcon(icon)}
                          aria-label={icon}
                        >
                          {getIconByName(icon)}
                        </button>
                      ))
                    ) : (
                      <div className="col-span-6 flex h-32 items-center justify-center text-sm text-muted-foreground">
                        No recently used icons
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Common Icons */}
              <TabsContent value="Common" className="h-full">
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-6 gap-2 p-3">
                    {iconCategories.Common.map((icon) => (
                      <button
                        key={icon}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-md border border-transparent",
                          "hover:border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                          value === icon && "border-slate-200 bg-slate-100",
                        )}
                        onClick={() => handleSelectIcon(icon)}
                        aria-label={icon}
                      >
                        {getIconByName(icon)}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* All Icons */}
              <TabsContent value="All" className="h-full">
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-6 gap-2 p-3">
                    {allIcons.map((icon) => (
                      <button
                        key={icon}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-md border border-transparent",
                          "hover:border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                          value === icon && "border-slate-200 bg-slate-100",
                        )}
                        onClick={() => handleSelectIcon(icon)}
                        aria-label={icon}
                      >
                        {getIconByName(icon)}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Search Results */}
              <TabsContent value="Search" className="h-full">
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-6 gap-2 p-3">
                    {filteredIcons.length > 0 ? (
                      filteredIcons.map((icon) => (
                        <button
                          key={icon}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-md border border-transparent",
                            "hover:border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                            value === icon && "border-slate-200 bg-slate-100",
                          )}
                          onClick={() => handleSelectIcon(icon)}
                          aria-label={icon}
                        >
                          {getIconByName(icon)}
                        </button>
                      ))
                    ) : (
                      <div className="col-span-6 flex h-32 items-center justify-center text-sm text-muted-foreground">
                        No icons found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>

          {/* Customization options */}
          <div className="border-t p-3">
            <div className="grid grid-cols-3 gap-2">
              {/* Color selector */}
              {onColorChange && (
                <div>
                  <Select value={color} onValueChange={onColorChange}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Color" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColors.map((colorOption) => (
                        <SelectItem key={colorOption.value} value={colorOption.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "h-3 w-3 rounded-full",
                                `bg-${colorOption.value}-600 dark:bg-${colorOption.value}-500`,
                              )}
                            />
                            <span>{colorOption.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Size selector */}
              {onSizeChange && (
                <div>
                  <Select value={size} onValueChange={onSizeChange}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSizes.map((sizeOption) => (
                        <SelectItem key={sizeOption.value} value={sizeOption.value}>
                          {sizeOption.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Background selector */}
              {onBackgroundChange && (
                <div>
                  <Select value={background || "none"} onValueChange={onBackgroundChange}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Background" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {availableColors.map((colorOption) => (
                        <SelectItem key={colorOption.value} value={colorOption.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "h-3 w-3 rounded-full",
                                `bg-${colorOption.value}-100 dark:bg-${colorOption.value}-900`,
                              )}
                            />
                            <span>{colorOption.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
