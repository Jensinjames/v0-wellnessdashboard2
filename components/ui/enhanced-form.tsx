"use client"

import * as React from "react"
import { useFormAccessibility } from "@/hooks/use-form-accessibility"
import {
  Form as ShadcnForm,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export interface EnhancedFormProps extends React.ComponentProps<typeof ShadcnForm> {
  idPrefix?: string
}

export const EnhancedForm = React.forwardRef<React.ElementRef<typeof ShadcnForm>, EnhancedFormProps>(
  ({ idPrefix = "form", ...props }, ref) => {
    return <ShadcnForm {...props} ref={ref} />
  },
)
EnhancedForm.displayName = "EnhancedForm"

export interface EnhancedFormFieldProps extends React.ComponentProps<typeof FormField> {
  idPrefix?: string
}

export const EnhancedFormField = React.forwardRef<React.ElementRef<typeof FormField>, EnhancedFormFieldProps>(
  ({ idPrefix, ...props }, ref) => {
    const { generateFieldId } = useFormAccessibility()
    const fieldId = props.name ? `${idPrefix || "field"}-${props.name}` : generateFieldId(idPrefix)

    return (
      <FormField
        {...props}
        ref={ref}
        render={(renderProps) => {
          const { field, formState } = renderProps
          const error = formState.errors[field.name]
          const isInvalid = !!error

          // If the original render function is provided, use it
          if (typeof props.render === "function") {
            return props.render(renderProps)
          }

          // Otherwise, provide a default render function with accessibility enhancements
          return (
            <FormItem>
              <FormLabel htmlFor={fieldId}>
                {props.label || field.name}
                {props.required && (
                  <span className="text-red-500 ml-1" aria-hidden="true">
                    *
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <input
                  id={fieldId}
                  {...field}
                  aria-invalid={isInvalid}
                  aria-required={props.required}
                  aria-describedby={isInvalid ? `${fieldId}-error` : undefined}
                />
              </FormControl>
              {props.description && (
                <FormDescription id={`${fieldId}-description`}>{props.description}</FormDescription>
              )}
              {isInvalid && <FormMessage id={`${fieldId}-error`} />}
            </FormItem>
          )
        }}
      />
    )
  },
)
EnhancedFormField.displayName = "EnhancedFormField"

// Re-export other form components
export { FormControl, FormDescription, FormItem, FormLabel, FormMessage }
