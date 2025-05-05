/**
 * Base form state interface with common properties
 */
export interface BaseFormState {
  isSubmitting: boolean
  isValid: boolean
  isDirty: boolean
  submitCount: number
  errors: Record<string, string>
}

/**
 * Activity form data interface
 */
export interface ActivityFormData {
  id?: string
  title: string
  category: string
  subcategory?: string
  date: Date
  duration: number
  intensity: number
  value?: number
  notes?: string
  reminder?: boolean
  tags?: string[]
}

/**
 * Activity form state interface
 */
export interface ActivityFormState extends BaseFormState {
  data: ActivityFormData
  originalData?: ActivityFormData
}

/**
 * Goal setting form field interface
 */
export interface GoalFormField {
  categoryId: string
  metricId: string
  value: number
  enabled: boolean
}

/**
 * Goal setting form data interface
 */
export interface GoalFormData {
  goals: GoalFormField[]
  categorySettings: {
    id: string
    enabled: boolean
  }[]
}

/**
 * Goal setting form state interface
 */
export interface GoalFormState extends BaseFormState {
  data: GoalFormData
  originalData?: GoalFormData
}

/**
 * Wellness entry metric field interface
 */
export interface WellnessEntryFormMetric {
  categoryId: string
  metricId: string
  value: number
}

/**
 * Wellness entry form data interface
 */
export interface WellnessEntryFormData {
  id?: string
  date: Date
  metrics: WellnessEntryFormMetric[]
  notes?: string
}

/**
 * Wellness entry form state interface
 */
export interface WellnessEntryFormState extends BaseFormState {
  data: WellnessEntryFormData
  originalData?: WellnessEntryFormData
}

/**
 * Category form data interface
 */
export interface CategoryFormData {
  id?: string
  name: string
  description: string
  icon: string
  color: string
  enabled: boolean
}

/**
 * Category form state interface
 */
export interface CategoryFormState extends BaseFormState {
  data: CategoryFormData
  originalData?: CategoryFormData
}

/**
 * Metric form data interface
 */
export interface MetricFormData {
  id?: string
  categoryId: string
  name: string
  description: string
  unit: string
  min: number
  max: number
  step: number
  defaultValue: number
  defaultGoal: number
}

/**
 * Metric form state interface
 */
export interface MetricFormState extends BaseFormState {
  data: MetricFormData
  originalData?: MetricFormData
}

/**
 * Form validation result interface
 */
export interface ValidationResult {
  valid: boolean
  errors?: Record<string, string>
  errorMessages?: string[]
}

/**
 * Form submission result interface
 */
export interface SubmissionResult<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string>
}

/**
 * Form field validation options
 */
export interface FieldValidationOptions {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

/**
 * Date range form data
 */
export interface DateRangeFormData {
  startDate: Date
  endDate: Date
  preset?: "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "custom"
}

/**
 * Filter form data
 */
export interface FilterFormData {
  categories: string[]
  dateRange: DateRangeFormData
  minDuration?: number
  maxDuration?: number
  tags?: string[]
  searchTerm?: string
}

/**
 * User settings form data
 */
export interface UserSettingsFormData {
  displayName: string
  email: string
  theme: "light" | "dark" | "system"
  notifications: {
    email: boolean
    push: boolean
    reminders: boolean
  }
  privacySettings: {
    shareData: boolean
    anonymizeData: boolean
  }
  unitPreferences: {
    distance: "km" | "mi"
    weight: "kg" | "lb"
    temperature: "c" | "f"
  }
}

/**
 * Export settings form data
 */
export interface ExportFormData {
  format: "csv" | "json" | "pdf"
  dateRange: DateRangeFormData
  includeCategories: string[]
  includeNotes: boolean
  includeMetadata: boolean
}
