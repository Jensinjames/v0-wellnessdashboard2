# Export Patterns Cheatsheet

## Next.js App Router

| Component Type | Export Pattern | Example |
|----------------|----------------|---------|
| Page Component | Default Export | `export default function Page() {}` |
| Layout Component | Default Export | `export default function Layout() {}` |
| Loading Component | Default Export | `export default function Loading() {}` |
| Error Component | Default Export | `export default function Error() {}` |
| Not Found Component | Default Export | `export default function NotFound() {}` |
| Route Handler | Named Export | `export async function GET() {}` |
| Metadata | Named Export | `export const metadata = {}` |
| generateMetadata | Named Export | `export async function generateMetadata() {}` |

## React Components

| Component Type | Recommended Pattern | Example |
|----------------|---------------------|---------|
| Feature Component | Default Export | `export default function FeatureComponent() {}` |
| UI Component | Named Export | `export function Button() {}` |
| Multiple Related Components | Named Exports | `export function TabList() {}` <br> `export function TabItem() {}` |
| HOC Component | Named Export | `export function withAuth(Component) {}` |

## Hooks and Utilities

| Function Type | Recommended Pattern | Example |
|---------------|---------------------|---------|
| Custom Hook | Named Export | `export function useProfile() {}` |
| Utility Function | Named Export | `export function formatDate() {}` |
| Context Provider | Named Export | `export function ProfileProvider() {}` |
| Context Hook | Named Export | `export function useProfileContext() {}` |

## TypeScript Types

| Type | Recommended Pattern | Example |
|------|---------------------|---------|
| Interface | Named Export | `export interface ProfileProps {}` |
| Type Alias | Named Export | `export type ProfileUpdateInput = {}` |
| Enum | Named Export | `export enum ProfileStatus {}` |
| Constant | Named Export | `export const MAX_USERNAME_LENGTH = 30` |

## Common Patterns

### Default + Type Export

\`\`\`tsx
export interface ComponentProps {
  // Props
}

export default function Component(props: ComponentProps) {
  // Implementation
}
\`\`\`

### Named Component + Variants

\`\`\`tsx
export function Button({ variant, ...props }) {
  // Implementation
}

export const buttonVariants = {
  // Variants
}
\`\`\`

### Re-exporting from Index

\`\`\`tsx
// For default exports
export { default as ProfileSettings } from './profile-settings'

// For named exports from './button'
