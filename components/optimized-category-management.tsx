"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useWellness } from "@/context/wellness-context"

type Category = {
  id: string
  name: string
  color: string
}

export function OptimizedCategoryManagement() {
  const {
    categories,
    addCategory: addCategoryContext,
    updateCategory,
    removeCategory: removeCategoryContext,
    isLoading,
  } = useWellness()
  const [newCategory, setNewCategory] = useState("")
  const [newColor, setNewColor] = useState("#3b82f6")

  const handleAddCategory = async () => {
    if (newCategory.trim() === "") return

    const newId = Math.random().toString(36).substring(2, 9)
    await addCategoryContext({
      name: newCategory,
      description: "",
      color: newColor,
      icon: "LayersIcon",
      metrics: [],
      enabled: true,
    })
    setNewCategory("")
  }

  const handleRemoveCategory = async (id: string) => {
    await removeCategoryContext(id)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-2 rounded-md bg-muted">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                  <span>{category.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCategory(category.id)}
                  className={cn("h-8 w-8 p-0", "text-muted-foreground hover:text-destructive")}
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category"
              className="flex-1"
            />
            <Input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-12" />
            <Button onClick={handleAddCategory}>Add</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
