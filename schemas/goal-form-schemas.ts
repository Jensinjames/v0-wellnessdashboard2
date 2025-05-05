import * as z from "zod"
import { createNumberSchema, createBooleanSchema } from "@/utils/zod-schemas"

// Schema for a single goal field
export const goalFieldSchema = z.object({
  categoryId: z.string({
    required_error: "Category ID is required",
    invalid_type_error: "Category ID must be text",
  }),
  metricId: z.string({
    required_error: "Metric ID is required",
    invalid_type_error: "Metric ID must be text",
  }),
  value: createNumberSchema({
    name: "Goal value",
  }),
  enabled: createBooleanSchema({
    name: "Enabled",
  }),
})

// Schema for category settings in goal form
export const categorySetting = z.object({
  id: z.string({
    required_error: "Category ID is required",
    invalid_type_error: "Category ID must be text",
  }),
  enabled: createBooleanSchema({
    name: "Enabled",
  }),
})

// Schema for the entire goal setting form
export const goalFormSchema = z.object({
  goals: z
    .array(goalFieldSchema, {
      required_error: "At least one goal is required",
      invalid_type_error: "Goals must be a list",
    })
    .min(1, "At least one goal is required"),
  categorySettings: z.array(categorySetting, {
    required_error: "Category settings are required",
    invalid_type_error: "Category settings must be a list",
  }),
})

// Type inference
export type GoalFormValues = z.infer<typeof goalFormSchema>
