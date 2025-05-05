import * as z from "zod"

// Define options for goal-to-value validation
interface GoalToValueOptions {
  allowExceedGoal: boolean
  minProgressPercent: number
  maxProgressPercent: number
  parameterName?: string
}

// Define options for weight-to-value validation
interface WeightToValueOptions {
  minValueForHighWeight: number
  parameterName?: string
}

// Define options for historical consistency validation
interface HistoricalConsistencyOptions {
  maxDailyChange: number
  parameterNames: Record<string, string>
}

// Define the schema for the entire form
export function createInterdependentFormSchema(options: {
  allowExceedGoal: boolean
  minProgressPercent: number
  maxProgressPercent: number
  minValueForHighWeight: number
  maxScoreDifference: number
}) {
  return z.object({
    date: z
      .date({
        required_error: "Please select a date for your activity entry.",
        invalid_type_error: "That's not a valid date",
      })
      .refine((date) => date <= new Date(), { message: "Activity date cannot be in the future" }),
    categoryId: z
      .string({
        required_error: "Please select a wellness category.",
      })
      .min(1, { message: "Category selection is required" }),
    subcategories: z.array(
      z.object({
        id: z.string(),
        name: z.string().min(1, { message: "Subcategory name cannot be empty" }),
        parameters: z
          .array(
            z.object({
              id: z.string(),
              name: z.string().min(1, { message: "Parameter name cannot be empty" }),
              value: z
                .number()
                .min(0, { message: "Value must be at least 0" })
                .max(10, { message: "Value cannot exceed 10" }),
              weight: z
                .number()
                .min(1, { message: "Weight must be at least 1" })
                .max(10, { message: "Weight cannot exceed 10" })
                .default(1),
              notes: z.string().optional(),
              goal: z
                .number()
                .min(0, { message: "Goal must be at least 0" })
                .max(10, { message: "Goal cannot exceed 10" })
                .optional(),
            }),
          )
          .min(1, { message: "At least one parameter is required" }),
        score: z.number().optional(),
      }),
    ),
    notes: z.string().max(500, { message: "Notes cannot exceed 500 characters" }).optional(),
  })
}

// Validate goal-to-value relationship
export function validateGoalToValue(
  value: number,
  goal: number | undefined,
  options: GoalToValueOptions,
): { valid: boolean; message?: string } {
  if (!goal || goal === 0) {
    return { valid: true }
  }

  const paramName = options.parameterName ? `"${options.parameterName}"` : "This parameter"

  // Check if value exceeds goal when not allowed
  if (!options.allowExceedGoal && value > goal) {
    return {
      valid: false,
      message: `${paramName} value (${value}) exceeds your goal (${goal})`,
    }
  }

  // Check if value is too low compared to goal
  const progressPercent = (value / goal) * 100
  if (progressPercent < options.minProgressPercent) {
    return {
      valid: false,
      message: `${paramName} value (${value}) is significantly below your goal (${goal})`,
    }
  }

  // Check if value is unrealistically high compared to goal
  if (progressPercent > options.maxProgressPercent) {
    return {
      valid: false,
      message: `${paramName} value (${value}) is unrealistically high compared to your goal (${goal})`,
    }
  }

  return { valid: true }
}

// Validate weight-to-value relationship
export function validateWeightToValue(
  value: number,
  weight: number,
  options: WeightToValueOptions,
): { valid: boolean; message?: string } {
  const paramName = options.parameterName ? `"${options.parameterName}"` : "This parameter"

  // Check if a high-weight parameter has a low value
  if (weight > 5 && value < options.minValueForHighWeight) {
    return {
      valid: false,
      message: `${paramName} has high importance (${weight}) but a low value (${value})`,
    }
  }

  return { valid: true }
}

// Validate consistency across subcategories
export function validateSubcategoryConsistency(
  subcategories: Array<{
    id: string
    name: string
    parameters: Array<{
      id: string
      name: string
      value: number
      weight: number
    }>
    score?: number
  }>,
): { valid: boolean; message?: string; affectedSubcategories?: string[] } {
  if (subcategories.length <= 1) {
    return { valid: true }
  }

  // Calculate average scores for each subcategory
  const subcategoryScores = subcategories.map((sub) => {
    const totalWeight = sub.parameters.reduce((sum, param) => sum + param.weight, 0)
    const weightedSum = sub.parameters.reduce((sum, param) => sum + param.value * param.weight, 0)
    const score = totalWeight > 0 ? weightedSum / totalWeight : 0
    return { name: sub.name, score }
  })

  // Find max difference between subcategory scores
  let maxDiff = 0
  let subcat1 = ""
  let subcat2 = ""

  for (let i = 0; i < subcategoryScores.length; i++) {
    for (let j = i + 1; j < subcategoryScores.length; j++) {
      const diff = Math.abs(subcategoryScores[i].score - subcategoryScores[j].score)
      if (diff > maxDiff) {
        maxDiff = diff
        subcat1 = subcategoryScores[i].name
        subcat2 = subcategoryScores[j].name
      }
    }
  }

  // If max difference is too large, return warning
  if (maxDiff > 5) {
    return {
      valid: false,
      message: `Large difference (${maxDiff.toFixed(1)} points) between "${subcat1}" and "${subcat2}" scores`,
      affectedSubcategories: [subcat1, subcat2],
    }
  }

  return { valid: true }
}

// Validate consistency with historical data
export function validateHistoricalConsistency(
  currentValues: Array<{ parameterId: string; value: number }>,
  historicalValues: Array<{ parameterId: string; value: number; date: Date }>,
  options: HistoricalConsistencyOptions,
): { valid: boolean; message?: string; affectedParameters?: string[] } {
  if (historicalValues.length === 0 || currentValues.length === 0) {
    return { valid: true }
  }

  const today = new Date()
  const affectedParameters: string[] = []

  // Check each current parameter value against recent historical values
  for (const current of currentValues) {
    // Find recent values for this parameter (last 7 days)
    const recentValues = historicalValues
      .filter(
        (h) =>
          h.parameterId === current.parameterId &&
          Math.abs(today.getTime() - h.date.getTime()) < 7 * 24 * 60 * 60 * 1000,
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by date descending

    // If we have recent values, check for large changes
    if (recentValues.length > 0) {
      const mostRecent = recentValues[0]
      const change = Math.abs(current.value - mostRecent.value)

      if (change > options.maxDailyChange) {
        const paramName = options.parameterNames[current.parameterId] || current.parameterId
        affectedParameters.push(paramName)
      }
    }
  }

  if (affectedParameters.length > 0) {
    return {
      valid: false,
      message: `Unusual changes detected in: ${affectedParameters.join(", ")}`,
      affectedParameters,
    }
  }

  return { valid: true }
}
