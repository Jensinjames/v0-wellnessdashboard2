import { z } from "zod"

// Schema for metrics within a category
export const metricSchema = z.object({
  id: z.string().min(1, "Metric ID is required"),
  name: z.string().min(1, "Metric name is required"),
  description: z.string().optional(),
  unit: z.string().optional(),
  target: z.number().optional(),
  weight: z.number().min(0).max(100).default(1),
  color: z.string().optional(),
})

// Schema for a single category
export const categorySchema = z.object({
  id: z.string().min(1, "Category ID is required"),
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  metrics: z.array(metricSchema).default([]),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  isActive: z.boolean().default(true),
  order: z.number().optional(),
})

// Schema for the category form
export const categoryFormSchema = categorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  order: true,
})

// Schema for the categories store (object with IDs as keys)
export const categoriesStoreSchema = z.record(z.string(), categorySchema)

// Type definitions derived from schemas
export type Metric = z.infer<typeof metricSchema>
export type Category = z.infer<typeof categorySchema>
export type CategoryFormData = z.infer<typeof categoryFormSchema>
export type CategoriesStore = z.infer<typeof categoriesStoreSchema>

// Helper function to validate a single category
export function validateCategory(category: unknown): {
  valid: boolean
  data?: Category
  errors?: z.ZodError
} {
  try {
    const validatedData = categorySchema.parse(category)
    return { valid: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error }
    }
    throw error
  }
}

// Helper function to validate the entire categories store
export function validateCategoriesStore(store: unknown): {
  valid: boolean
  data?: CategoriesStore
  errors?: z.ZodError
} {
  try {
    const validatedData = categoriesStoreSchema.parse(store)
    return { valid: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error }
    }
    throw error
  }
}

// Helper to convert from array to object structure
export function categoriesToStore(categories: Category[]): CategoriesStore {
  return categories.reduce((acc, category) => {
    acc[category.id] = category
    return acc
  }, {} as CategoriesStore)
}

// Helper to convert from object to array structure
export function storeToCategories(store: CategoriesStore): Category[] {
  return Object.values(store)
}
