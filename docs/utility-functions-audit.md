# Utility Functions Audit

## Utility Files with Inconsistent Patterns

| File | Current Export | Recommended Export | Issue |
|------|---------------|-------------------|-------|
| `utils/date-utils.ts` | Mixed | Named | ⚠️ Should use consistent named exports |
| `utils/format-utils.ts` | Named | Named | ✅ Correct |
| `utils/validation-utils.ts` | Named | Named | ✅ Correct |
| `utils/storage-utils.ts` | Default | Named | ⚠️ Should use named exports |

## Recommended Updates

For consistency, all utility functions should use named exports:

\`\`\`tsx
// Before (mixed exports)
export function formatDate(date) {
  // Function code
}

export default {
  formatDate,
  parseDate,
}

// After (consistent named exports)
export function formatDate(date) {
  // Function code
}

export function parseDate(dateString) {
  // Function code
}
\`\`\`

## Impact

Updating these utility files will:
1. Improve consistency across the codebase
2. Enable better tree-shaking
3. Make imports more explicit
4. Improve type safety

Let me create a script to find the issue:
