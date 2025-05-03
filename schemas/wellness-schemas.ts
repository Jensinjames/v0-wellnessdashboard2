import { z } from "zod"

// Define literal types for well-known category IDs
const wellKnownCategoryIds = ["faith", "life", "work", "health", "mindfulness", "learning", "relationships"] as const

// Define allowed units for metrics
const metricUnitEnum = z.enum([
  "minutes",
  "hours",
  "percent",
  "count",
  "level",
  "score",
  "days",
  "reps",
  "steps",
  "calories",
  "miles",
  "km",
])

// Metric schema
export const metricSchema = z
  .object({
    id: z.string().min(1, "Metric ID is required").max(50, "Metric ID too long"),
    name: z.string().min(1, "Metric name is required").max(100, "Metric name too long"),
    description: z.string().max(500, "Description too long").optional().default(""),
    unit: metricUnitEnum,
    min: z.number().default(0),
    max: z.number(),
    step: z.number().positive("Step must be positive").default(1),
    defaultValue: z.number(),
    defaultGoal: z.number(),
  })
  .refine((data) => data.max > data.min, {
    message: "Maximum value must be greater than minimum value",
    path: ["max"],
  })

// Category schema
export const categorySchema = z
  .object({
    id: z.union([
      z.enum(wellKnownCategoryIds),
      z
        .string()
        .min(1, "Category ID is required")
        .regex(/^[a-z0-9-]+$/, "Category ID must contain only lowercase letters, numbers, and hyphens"),
    ]),
    name: z.string().min(1, "Category name is required").max(50, "Category name too long"),
    description: z.string().max(500, "Description too long").optional().default(""),
    icon: z.string().min(1, "Icon is required"),
    color: z.string().min(1, "Color is required"),
    metrics: z.array(metricSchema).default([]),
    enabled: z.boolean().default(true),
    order: z.number().optional(),
  })
  .superRefine((category, ctx) => {
    // Check for duplicate metric IDs
    const metricIds = new Set<string>()
    category.metrics.forEach((metric, index) => {
      if (metricIds.has(metric.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate metric ID: ${metric.id}`,
          path: [`metrics.${index}.id`],
        })
      }
      metricIds.add(metric.id)
    })
  })

// Goal schema
export const goalSchema = z.object({
  categoryId: z.string().min(1, "Category ID is required"),
  metricId: z.string().min(1, "Metric ID is required"),
  value: z.number(),
  targetDate: z.date().optional(),
  notes: z.string().max(500, "Notes too long").optional(),
})

// Entry metric schema
export const entryMetricSchema = z.object({
  categoryId: z.string().min(1, "Category ID is required"),
  metricId: z.string().min(1, "Metric ID is required"),
  value: z.number(),
  notes: z.string().max(500, "Notes too long").optional(),
})

// Entry schema
export const entrySchema = z.object({
  id: z.string().min(1, "Entry ID is required"),
  date: z.date(),
  metrics: z.array(entryMetricSchema).min(1, "At least one metric is required"),
  notes: z.string().max(1000, "Notes too long").optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z
    .date()
    .optional()
    .default(() => new Date()),
  updatedAt: z
    .date()
    .optional()
    .default(() => new Date()),
})

// Categories array schema
export const categoriesArraySchema = z.array(categorySchema)

// Goals array schema
export const goalsArraySchema = z.array(goalSchema)

// Entries array schema
export const entriesArraySchema = z.array(entrySchema)

// Complete wellness data schema
export const wellnessDataSchema = z.object({
  categories: categoriesArraySchema,
  goals: goalsArraySchema,
  entries: entriesArraySchema,
  settings: z.record(z.string(), z.unknown()).optional(),
  lastUpdated: z.date().optional(),
})

// Type exports
export type WellnessMetric = z.infer<typeof metricSchema>
export type WellnessCategory = z.infer<typeof categorySchema>
export type WellnessGoal = z.infer<typeof goalSchema>
export type WellnessEntryMetric = z.infer<typeof entryMetricSchema>
export type WellnessEntry = z.infer<typeof entrySchema>
export type WellnessData = z.infer<typeof wellnessDataSchema>
