import * as z from "zod"
import { createTextSchema, createNumberSchema } from "@/utils/zod-schemas"

// Schema for metric units
export const metricUnitSchema = z.enum(["minutes", "hours", "percent", "count", "level", "custom"], {
  invalid_type_error: "Please select a valid unit",
  required_error: "Unit is required",
})

// Schema for a single metric
export const metricSchema = z
  .object({
    id: z.string().optional(), // Optional for new metrics
    name: createTextSchema({
      name: "Metric name",
      min: 1,
      max: 50,
    }),
    description: createTextSchema({
      name: "Description",
      required: false,
      max: 200,
    }),
    unit: metricUnitSchema,
    min: createNumberSchema({
      name: "Minimum value",
      min: 0,
    }),
    max: createNumberSchema({
      name: "Maximum value",
      min: 1,
    }).refine((val) => val > 0, "Maximum value must be greater than 0"),
    step: createNumberSchema({
      name: "Step",
      min: 0.1,
    }),
    defaultValue: createNumberSchema({
      name: "Default value",
    }),
    defaultGoal: createNumberSchema({
      name: "Default goal",
    }),
  })
  .refine((data) => data.max > data.min, {
    message: "Maximum value must be greater than minimum value",
    path: ["max"],
  })
  .refine((data) => data.defaultValue >= data.min && data.defaultValue <= data.max, {
    message: "Default value must be between minimum and maximum values",
    path: ["defaultValue"],
  })
  .refine((data) => data.defaultGoal >= data.min && data.defaultGoal <= data.max, {
    message: "Default goal must be between minimum and maximum values",
    path: ["defaultGoal"],
  })

// Schema for category colors
export const categoryColorSchema = z.enum(
  [
    "slate",
    "gray",
    "zinc",
    "neutral",
    "stone",
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
  ],
  {
    invalid_type_error: "Please select a valid color",
    required_error: "Color is required",
  },
)

// Schema for category form
export const categoryFormSchema = z.object({
  id: z.string().optional(), // Optional for new categories
  name: createTextSchema({
    name: "Category name",
    min: 1,
    max: 50,
  }),
  description: createTextSchema({
    name: "Description",
    min: 1,
    max: 200,
  }),
  icon: createTextSchema({
    name: "Icon",
    min: 1,
  }),
  color: categoryColorSchema,
  enabled: z.boolean().default(true),
  metrics: z.array(metricSchema).optional(),
})

// Type inference
export type MetricFormValues = z.infer<typeof metricSchema>
export type CategoryFormValues = z.infer<typeof categoryFormSchema>
