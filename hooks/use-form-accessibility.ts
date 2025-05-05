"use client"

import { useCallback } from "react"
import { generateUniqueId } from "@/utils/generate-unique-id"

/**
 * Custom hook to provide accessibility utilities for forms
 *
 * @returns Object with utility functions for form accessibility
 */
export function useFormAccessibility() {
  /**
   * Generates a unique ID for a form element with an optional prefix
   *
   * @param prefix - Optional prefix for the ID
   * @returns A unique ID string
   */
  const generateFieldId = useCallback((prefix = "field") => {
    return `${prefix}-${generateUniqueId()}`
  }, [])

  /**
   * Creates an object with aria attributes for a form field
   *
   * @param id - The ID of the form field
   * @param labelText - The text of the label
   * @param required - Whether the field is required
   * @param invalid - Whether the field is invalid
   * @param errorMessage - The error message if the field is invalid
   * @returns Object with aria attributes
   */
  const getAriaAttributes = useCallback(
    (id: string, labelText: string, required = false, invalid = false, errorMessage?: string) => {
      const attributes: Record<string, string | boolean> = {
        id,
        "aria-required": required,
      }

      if (invalid) {
        attributes["aria-invalid"] = true
        if (errorMessage) {
          const errorId = `${id}-error`
          attributes["aria-describedby"] = errorId
        }
      }

      return attributes
    },
    [],
  )

  return {
    generateFieldId,
    getAriaAttributes,
  }
}
