"use client"

import { WellnessProvider } from "@/context/wellness-context"
import { CategoryManagement } from "@/components/category-management"

export function CategoryManagementWrapper() {
  return (
    <WellnessProvider>
      <CategoryManagement />
    </WellnessProvider>
  )
}
