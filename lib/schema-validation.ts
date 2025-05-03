import { z } from "zod"

// Define the schema for wellness metrics
export const metricSchema = z
  .object({
    id: z.string().min(1, "Metric ID is required"),
    name: z.string().min(1, "Metric name is required"),
    description: z.string(),
    unit: z.enum(["minutes", "hours", "percent", "count", "level", "string"]),
    min: z.number(),
    max: z.number(),
    step: z.number().positive("Step must be positive"),
    defaultValue: z.number(),
    defaultGoal: z.number(),
  })
  .refine((data) => data.max > data.min, {
    message: "Maximum value must be greater than minimum value",
    path: ["max"],
  })

// Define the schema for wellness categories
export const categorySchema = z.object({
  id: z
    .string()
    .min(1, "Category ID is required")
    .regex(/^[a-z0-9-]+$/, "Category ID must contain only lowercase letters, numbers, and hyphens"),
  name: z.string().min(1, "Category name is required"),
  description: z.string(),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
  metrics: z.array(metricSchema).superRefine((metrics, ctx) => {
    // Check for duplicate metric IDs
    const metricIds = new Set<string>()
    metrics.forEach((metric, index) => {
      if (metricIds.has(metric.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate metric ID: ${metric.id}`,
          path: [index, "id"],
        })
      }
      metricIds.add(metric.id)
    })
  }),
  enabled: z.boolean(),
})

// Define the schema for wellness goals
export const goalSchema = z.object({
  categoryId: z.string(),
  metricId: z.string(),
  value: z.number(),
})

// Define the schema for wellness entry metrics
export const entryMetricSchema = z.object({
  categoryId: z.string(),
  metricId: z.string(),
  value: z.number(),
})

// Define the schema for wellness entries
export const entrySchema = z.object({
  id: z.string(),
  date: z.date(),
  metrics: z.array(entryMetricSchema),
})

// Define the schema for the entire wellness data structure
export const wellnessDataSchema = z.object({
  categories: z.record(z.string(), categorySchema),
  goals: z.array(goalSchema),
  entries: z.array(entrySchema),
})

// Type definitions based on the schemas
export type ValidMetric = z.infer<typeof metricSchema>
export type ValidCategory = z.infer<typeof categorySchema>
export type ValidGoal = z.infer<typeof goalSchema>
export type ValidEntryMetric = z.infer<typeof entryMetricSchema>
export type ValidEntry = z.infer<typeof entrySchema>
export type ValidWellnessData = z.infer<typeof wellnessDataSchema>

// Helper function to validate a category
export function validateCategory(category: unknown): {
  success: boolean
  data?: ValidCategory
  error?: z.ZodError
} {
  try {
    const validatedData = categorySchema.parse(category)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error }
    }
    throw error
  }
}

// Helper function to validate a metric
export function validateMetric(metric: unknown): {
  success: boolean
  data?: ValidMetric
  error?: z.ZodError
} {
  try {
    const validatedData = metricSchema.parse(metric)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error }
    }
    throw error
  }
}

// Helper function to validate the entire wellness data structure
export function validateWellnessData(data: unknown): {
  success: boolean
  data?: ValidWellnessData
  error?: z.ZodError
} {
  try {
    const validatedData = wellnessDataSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error }
    }
    throw error
  }
}

// Helper function to format Zod errors into user-friendly messages
export function formatZodError(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join(".")
    return path ? `${path}: ${err.message}` : err.message
  })
}
