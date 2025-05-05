# Form Accessibility Guidelines

## Overview

This document outlines the accessibility standards for forms in the Wellness Dashboard application. Following these guidelines ensures that our forms are usable by all users, including those with disabilities, and supports proper form autofilling by browsers.

## Key Requirements

1. **Unique IDs**: Every form field must have a unique `id` attribute.
2. **Label Associations**: Every form field must be associated with a label.
3. **Error Messages**: Error messages must be programmatically associated with their corresponding form fields.
4. **Required Fields**: Required fields must be clearly indicated both visually and programmatically.

## Implementation Methods

### Method 1: Explicit Label Association (Preferred)

\`\`\`jsx
<Label htmlFor="email">Email</Label>
<Input id="email" name="email" type="email" />
\`\`\`

### Method 2: Wrapping Inputs in Labels

\`\`\`jsx
<Label>
  Email
  <Input name="email" type="email" />
</Label>
\`\`\`

### Method 3: Using the AccessibleFormField Component

\`\`\`jsx
<AccessibleFormField 
  label="Email" 
  required={true}
  error={errors.email}
  hint="We'll never share your email with anyone else."
>
  <Input name="email" type="email" />
</AccessibleFormField>
\`\`\`

## ARIA Attributes

- Use `aria-required="true"` for required fields
- Use `aria-invalid="true"` for fields with validation errors
- Use `aria-describedby` to associate error messages with form fields

## Form Autofilling

To support browser autofill features:

1. Use standard `name` attributes for common fields:
   - `name="email"` for email fields
   - `name="password"` for password fields
   - `name="given-name"` and `name="family-name"` for name fields

2. Use appropriate `autocomplete` attributes:
   - `autocomplete="email"` for email fields
   - `autocomplete="new-password"` for new password fields
   - `autocomplete="current-password"` for current password fields

## Testing

Test all forms with:
1. Keyboard navigation
2. Screen readers (NVDA, VoiceOver, JAWS)
3. Browser autofill functionality
4. High contrast mode
\`\`\`

## 15. Update the Form Component to Support Accessibility

Let's enhance the shadcn Form component to better support accessibility:
