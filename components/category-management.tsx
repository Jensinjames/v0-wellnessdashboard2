"use client"

import { CardDescription } from "@/components/ui/card"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function CategoryManagement() {
  const [categories, setCategories] = useState([
    { id: "faith", name: "Faith" },
    { id: "life", name: "Life" },
    { id: "work", name: "Work" },
    { id: "health", name: "Health" },
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Management</CardTitle>
        <CardDescription>Add, edit, and delete categories</CardDescription>
      </CardHeader>
      <CardContent>
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between py-2">
            <span>{category.name}</span>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
