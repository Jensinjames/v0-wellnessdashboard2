"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useWellness } from "@/context/wellness-context-optimistic"
import { Loader2, Plus, X } from "lucide-react"
import { PendingOperationsIndicator } from "@/components/pending-operations-indicator"

export function OptimisticCategoryManagement() {
  const { categories, addCategory, removeCategory, isPendingCategory } = useWellness()
  const [newCategory, setNewCategory] = useState("")
  const [newColor, setNewColor] = useState("#3b82f6")
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  const handleAddCategory = async () => {
    if (newCategory.trim() === "") return

    setIsAddingCategory(true)

    try {
      await addCategory({
        name: newCategory,
        description: "",
        color: newColor,
        icon: "LayersIcon",
        metrics: [],
        enabled: true,
      })

      // Clear form
      setNewCategory("")
    } finally {
      setIsAddingCategory(false)
    }
  }

  const handleRemoveCategory = async (id: string) => {
    await removeCategory(id)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Category Management</CardTitle>
        <PendingOperationsIndicator />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            {categories.map((category) => {
              const isPending = isPendingCategory(category.id)

              return (
                <div
                  key={category.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md",
                    isPending ? "bg-muted/80" : "bg-muted",
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={cn("w-4 h-4 rounded-full", isPending && "opacity-70")}
                      style={{ backgroundColor: category.color }}
                    />
                    <span className={isPending ? "opacity-70" : ""}>{category.name}</span>
                    {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-2" />}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCategory(category.id)}
                    className={cn(
                      "h-8 w-8 p-0",
                      "text-muted-foreground hover:text-destructive",
                      isPending && "opacity-50 cursor-not-allowed",
                    )}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="flex space-x-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category"
              className="flex-1"
              disabled={isAddingCategory}
            />
            <Input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-12"
              disabled={isAddingCategory}
            />
            <Button
              onClick={handleAddCategory}
              disabled={isAddingCategory || newCategory.trim() === ""}
              className="gap-1"
            >
              {isAddingCategory ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
