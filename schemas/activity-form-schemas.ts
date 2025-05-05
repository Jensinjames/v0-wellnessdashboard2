import * as z from "zod"
import {
  createTextSchema,
  createNumberSchema,
  createDateSchema,
  createArraySchema,
  createBooleanSchema,
} from "@/utils/zod-schemas"

// Schema for activity categories
export const activityCategorySchema = z.enum(
  [
    "exercise",
    "meditation",
    "reading",
    "nutrition",
    "sleep",
    "social",
    "learning",
    "creative",
    "work",
    "leisure",
    "spiritual",
    "other",
  ],
  {
    invalid_type_error: "Please select a valid category",
    required_error: "Category is required",
  },
)

// Schema for activity tags
export const activityTagSchema = createTextSchema({
  name: "Tag",
  min: 1,
  max: 20,
})

// Schema for activity form
export const activityFormSchema = z.object({
  id: z.string().optional(),
  title: createTextSchema({
    name: "Title",
    min: 3,
    max: 100,
  }),
  category: activityCategorySchema,
  subcategory: createTextSchema({
    name: "Subcategory",
    required: false,
    max: 50,
  }),
  date: createDateSchema({
    name: "Date",
    max: new Date(), // Cannot be in the future
  }),
  duration: createNumberSchema({
    name: "Duration",
    min: 1,
    integer: true,
  }),
  intensity: createNumberSchema({
    name: "Intensity",
    min: 1,
    max: 5,
    integer: true,
  }),
  value: createNumberSchema({
    name: "Value",
    required: false,
  }),
  notes: createTextSchema({
    name: "Notes",
    required: false,
    max: 500,
  }),
  reminder: createBooleanSchema({
    name: "Reminder",
    required: false,
  }),
  tags: createArraySchema({
    name: "Tags",
    schema: activityTagSchema,
    required: false,
    max: 10,
  }),
})

// Schema for activity search/filter
export const activityFilterSchema = z.object({
  categories: z.array(activityCategorySchema).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minDuration: z.number().min(0).optional(),
  maxDuration: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  searchTerm: z.string().optional(),
})

// Type inference
export type ActivityFormValues = z.infer<typeof activityFormSchema>
export type ActivityFilterValues = z.infer<typeof activityFilterSchema>
