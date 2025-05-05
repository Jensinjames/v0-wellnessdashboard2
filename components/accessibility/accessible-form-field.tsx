"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { useFormAccessibility } from "@/hooks/use-form-accessibility"

interface AccessibleFormFieldProps {
  label: string
  children: React.ReactElement
  required?: boolean
  error?: string
  hint?: string
  className?: string
}

/**
 * A wrapper component that provides accessibility features for form fields
 */
export function AccessibleFormField({
  label,
  children,
  required = false,
  error,
  hint,
  className = "",
}: AccessibleFormFieldProps) {
  const { generateFieldId } = useFormAccessibility()
  const id = children.props.id || generateFieldId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined

  // Clone the child element with the necessary accessibility attributes
  const enhancedChild = React.cloneElement(children, {
    id,
    "aria-required": required,
    "aria-invalid": !!error,
    "aria-describedby": describedBy,
  })

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        )}
      </Label>

      {hint && (
        <div id={hintId} className="text-sm text-gray-500">
          {hint}
        </div>
      )}

      {enhancedChild}

      {error && (
        <div id={errorId} className="text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  )
}
