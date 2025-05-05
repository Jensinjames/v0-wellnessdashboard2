"use client"

import { CategoryManagement } from "@/components/category-management"
import { WellnessProvider } from "@/context/wellness-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CategoriesPage() {
  return (
    <WellnessProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
            <p className="mt-1 text-muted-foreground">Customize your wellness tracking categories and metrics</p>
          </div>

          <CategoryManagement />
        </div>
      </div>
    </WellnessProvider>
  )
}
