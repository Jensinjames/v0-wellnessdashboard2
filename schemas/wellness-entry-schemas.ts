import * as z from "zod"
import { createDateSchema, createTextSchema } from "@/utils/zod-schemas"

// Schema for a single wellness metric entry
export const wellnessMetricEntrySchema = z.object({
  categoryId: z.string({
    required_error: "Category ID is required",
    invalid_type_error: "Category ID must be text",
  }),
  metricId: z.string({
    required_error: "Metric ID is required",
    invalid_type_error: "Metric ID must be text",
  }),
  value: z.number({
    required_error: "Value is required",
    invalid_type_error: "Value must be a number",
  }),
})

// Schema for the entire wellness entry form
export const wellnessEntryFormSchema = z.object({
  id: z.string().optional(),
  date: createDateSchema({
    name: "Date",
    max: new Date(), // Cannot be in the future
  }),
  metrics: z
    .array(wellnessMetricEntrySchema, {
      required_error: "At least one metric is required",
      invalid_type_error: "Metrics must be a list",
    })
    .min(1, "At least one metric is required"),
  notes: createTextSchema({
    name: "Notes",
    required: false,
    max: 500,
  }),
})

// Schema for wellness entry search/filter
export const wellnessEntryFilterSchema = z.object({
  categories: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  searchTerm: z.string().optional(),
})

// Type inference
export type WellnessEntryFormValues = z.infer<typeof wellnessEntryFormSchema>
export type WellnessEntryFilterValues = z.infer<typeof wellnessEntryFilterSchema>
