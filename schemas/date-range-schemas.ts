import * as z from "zod"
import { createArraySchema } from "@/utils/zod-schemas"

// Schema for date range presets
export const dateRangePresetSchema = z.enum(
  ["today", "yesterday", "thisWeek", "lastWeek", "thisMonth", "lastMonth", "custom"],
  {
    invalid_type_error: "Please select a valid preset",
    required_error: "Preset is required",
  },
)

// Schema for date range form
export const dateRangeFormSchema = z
  .object({
    startDate: z.date({
      required_error: "Start date is required",
      invalid_type_error: "Start date must be a valid date",
    }),
    endDate: z.date({
      required_error: "End date is required",
      invalid_type_error: "End date must be a valid date",
    }),
    preset: dateRangePresetSchema.optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })

// Schema for export format
export const exportFormatSchema = z.enum(["csv", "json", "pdf"], {
  invalid_type_error: "Please select a valid export format",
  required_error: "Export format is required",
})

// Schema for export form
export const exportFormSchema = z.object({
  format: exportFormatSchema,
  dateRange: dateRangeFormSchema,
  includeCategories: createArraySchema({
    name: "Categories",
    schema: z.string(),
    min: 1,
  }),
  includeNotes: z.boolean(),
  includeMetadata: z.boolean(),
})

// Type inference
export type DateRangeFormValues = z.infer<typeof dateRangeFormSchema>
export type ExportFormValues = z.infer<typeof exportFormSchema>
