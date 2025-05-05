import * as z from "zod"
import { format } from "date-fns"

// ==========================================
// Utility functions for schema creation
// ==========================================

/**
 * Creates a schema for a text field with common validations
 */
export const createTextSchema = ({
  name,
  required = true,
  min,
  max,
}: {
  name: string
  required?: boolean
  min?: number
  max?: number
}) => {
  let schema = z.string({
    required_error: `${name} is required`,
    invalid_type_error: `${name} must be text`,
  })

  if (min !== undefined) {
    schema = schema.min(min, `${name} must be at least ${min} characters`)
  }

  if (max !== undefined) {
    schema = schema.max(max, `${name} cannot exceed ${max} characters`)
  }

  return required ? schema : schema.optional()
}

/**
 * Creates a schema for a numeric field with common validations
 */
export const createNumberSchema = ({
  name,
  required = true,
  min,
  max,
  integer = false,
}: {
  name: string
  required?: boolean
  min?: number
  max?: number
  integer?: boolean
}) => {
  let schema = z.number({
    required_error: `${name} is required`,
    invalid_type_error: `${name} must be a number`,
  })

  if (min !== undefined) {
    schema = schema.min(min, `${name} must be at least ${min}`)
  }

  if (max !== undefined) {
    schema = schema.max(max, `${name} cannot exceed ${max}`)
  }

  if (integer) {
    schema = schema.int(`${name} must be a whole number`)
  }

  return required ? schema : schema.optional()
}

/**
 * Creates a schema for a date field with common validations
 */
export const createDateSchema = ({
  name,
  required = true,
  min,
  max,
  pastOnly = false,
  futureOnly = false,
}: {
  name: string
  required?: boolean
  min?: Date
  max?: Date
  pastOnly?: boolean
  futureOnly?: boolean
}) => {
  let schema = z.date({
    required_error: `${name} is required`,
    invalid_type_error: `${name} must be a valid date`,
  })

  const now = new Date()

  if (min !== undefined) {
    schema = schema.min(min, `${name} must be after ${format(min, "PPP")}`)
  }

  if (max !== undefined) {
    schema = schema.max(max, `${name} must be before ${format(max, "PPP")}`)
  }

  if (pastOnly) {
    schema = schema.max(now, `${name} must be in the past`)
  }

  if (futureOnly) {
    schema = schema.min(now, `${name} must be in the future`)
  }

  return required ? schema : schema.optional()
}

/**
 * Creates a schema for an array field with common validations
 */
export const createArraySchema = <T extends z.ZodTypeAny>({
  name,
  schema,
  required = true,
  min,
  max,
}: {
  name: string
  schema: T
  required?: boolean
  min?: number
  max?: number
}) => {
  let arraySchema = z.array(schema, {
    required_error: `${name} is required`,
    invalid_type_error: `${name} must be a list`,
  })

  if (min !== undefined) {
    arraySchema = arraySchema.min(min, `${name} must have at least ${min} items`)
  }

  if (max !== undefined) {
    arraySchema = arraySchema.max(max, `${name} cannot have more than ${max} items`)
  }

  return required ? arraySchema : arraySchema.optional()
}

/**
 * Creates a schema for an email field
 */
export const createEmailSchema = ({ name = "Email", required = true }: { name?: string; required?: boolean } = {}) => {
  const schema = z
    .string({
      required_error: `${name} is required`,
      invalid_type_error: `${name} must be text`,
    })
    .email(`Please enter a valid email address`)

  return required ? schema : schema.optional()
}

/**
 * Creates a schema for a URL field
 */
export const createUrlSchema = ({ name = "URL", required = true }: { name?: string; required?: boolean } = {}) => {
  const schema = z
    .string({
      required_error: `${name} is required`,
      invalid_type_error: `${name} must be text`,
    })
    .url(`Please enter a valid URL`)

  return required ? schema : schema.optional()
}

/**
 * Creates a schema for a password field with common validations
 */
export const createPasswordSchema = ({
  name = "Password",
  required = true,
  min = 8,
}: {
  name?: string
  required?: boolean
  min?: number
} = {}) => {
  const schema = z
    .string({
      required_error: `${name} is required`,
      invalid_type_error: `${name} must be text`,
    })
    .min(min, `${name} must be at least ${min} characters`)
    .refine((password) => /[A-Z]/.test(password), `${name} must contain at least one uppercase letter`)
    .refine((password) => /[a-z]/.test(password), `${name} must contain at least one lowercase letter`)
    .refine((password) => /[0-9]/.test(password), `${name} must contain at least one number`)
    .refine((password) => /[^A-Za-z0-9]/.test(password), `${name} must contain at least one special character`)

  return required ? schema : schema.optional()
}

/**
 * Creates a schema for confirming passwords match
 */
export const createPasswordConfirmationSchema = (passwordField: string) => {
  return z
    .string({
      required_error: "Password confirmation is required",
    })
    .min(1, "Password confirmation is required")
    .refine((data) => data === passwordField, {
      message: "Passwords do not match",
    })
}

/**
 * Creates a schema for a phone number field
 */
export const createPhoneSchema = ({ name = "Phone", required = true }: { name?: string; required?: boolean } = {}) => {
  const schema = z
    .string({
      required_error: `${name} is required`,
      invalid_type_error: `${name} must be text`,
    })
    .regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number")

  return required ? schema : schema.optional()
}

/**
 * Creates a schema for a color field (hex format)
 */
export const createColorSchema = ({ name = "Color", required = true }: { name?: string; required?: boolean } = {}) => {
  const schema = z
    .string({
      required_error: `${name} is required`,
      invalid_type_error: `${name} must be text`,
    })
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Please enter a valid hex color code")

  return required ? schema : schema.optional()
}

/**
 * Creates a schema for a boolean field
 */
export const createBooleanSchema = ({
  name,
  required = true,
}: {
  name: string
  required?: boolean
} = {}) => {
  const schema = z.boolean({
    required_error: `${name} is required`,
    invalid_type_error: `${name} must be a boolean`,
  })

  return required ? schema : schema.optional()
}

/**
 * Creates a schema for an enum field
 */
export const createEnumSchema = <T extends [string, ...string[]]>({
  name,
  values,
  required = true,
}: {
  name: string
  values: T
  required?: boolean
}) => {
  const schema = z.enum(values, {
    required_error: `${name} is required`,
    invalid_type_error: `${name} must be one of: ${values.join(", ")}`,
  })

  return required ? schema : schema.optional()
}
