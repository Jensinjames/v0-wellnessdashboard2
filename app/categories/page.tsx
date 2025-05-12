import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CategoryManagementWrapper } from "@/components/category-management-wrapper"
import { ChevronLeft } from "lucide-react"

export default function CategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Category Management</h1>
        <p className="mt-1 text-muted-foreground">Customize your wellness tracking categories and metrics</p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <CategoryManagementWrapper />
        </div>
      </div>
    </div>
  )
}
