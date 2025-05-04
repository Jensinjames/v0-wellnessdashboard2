# Hooks Audit

## Hooks with Inconsistent Patterns

| Hook | Current Export | Recommended Export | Issue |
|------|---------------|-------------------|-------|
| `hooks/useSupabase.ts` | Named | Named | ✅ Correct |
| `hooks/useAuth.ts` | Named | Named | ✅ Correct |
| `hooks/useLocalStorage.ts` | Default | Named | ⚠️ Should be named export |
| `hooks/useMediaQuery.ts` | Named | Named | ✅ Correct |
| `hooks/useDebounce.ts` | Default | Named | ⚠️ Should be named export |

## Recommended Updates

For consistency, all hooks should use named exports and follow the "use" prefix naming convention:

\`\`\`tsx
// Before
export default function useLocalStorage(key, initialValue) {
  // Hook code
}

// After
export function useLocalStorage(key, initialValue) {
  // Hook code
}
\`\`\`

## Impact

Updating these hooks will:
1. Improve consistency across the codebase
2. Make imports more explicit
3. Follow React conventions for hooks
