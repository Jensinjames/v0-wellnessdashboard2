# Context Providers Audit

## Context Providers with Inconsistent Patterns

| Provider | Current Export | Recommended Export | Issue |
|----------|---------------|-------------------|-------|
| `context/auth-context.tsx` | Named | Named | ✅ Correct |
| `context/wellness-context.tsx` | Named | Named | ✅ Correct |
| `context/theme-context.tsx` | Default | Named | ⚠️ Should be named export |
| `context/notification-context.tsx` | Default | Named | ⚠️ Should be named export |

## Recommended Updates

For consistency, all context providers should use named exports:

\`\`\`tsx
// Before
export default function ThemeProvider({ children }) {
  // Provider code
}

// After
export function ThemeProvider({ children }) {
  // Provider code
}
\`\`\`

## Impact

Updating these providers will:
1. Improve consistency across the codebase
2. Enable better tree-shaking
3. Make imports more explicit
