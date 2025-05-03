import { OptimisticCategoryManagement } from "@/components/optimistic-category-management"

export default function OptimisticUiDemoPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Optimistic UI Demo</h1>
      <p className="text-muted-foreground mb-8">
        This page demonstrates optimistic UI updates. Try adding or removing categories to see the immediate UI
        feedback.
      </p>

      <OptimisticCategoryManagement />
    </div>
  )
}
