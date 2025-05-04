# UI Component Audit

## Components with Inconsistent Export Patterns

| Component | Current Export | Recommended Export | Reason |
|-----------|---------------|-------------------|--------|
| `components/dashboard-sidebar.tsx` | Default | Named | Reusable UI component |
| `components/mobile-nav.tsx` | Default | Named | Reusable UI component |
| `components/activity-timer.tsx` | Default | Named | Reusable UI component |
| `components/goal-setting-form.tsx` | Default | Named | Reusable UI component |
| `components/category-overview.tsx` | Named | Named | ✅ Correct |
| `components/ui/button.tsx` | Named | Named | ✅ Correct |
| `components/ui/card.tsx` | Named | Named | ✅ Correct |

## Recommended Updates

For consistency, reusable UI components should use named exports:

\`\`\`tsx
// Before
export default function DashboardSidebar() {
  // Component code
}

// After
export function DashboardSidebar() {
  // Component code
}
\`\`\`

## Impact

Updating these components will:
1. Improve consistency across the codebase
2. Enable better tree-shaking
3. Make imports more explicit
