# Client-Server Component Separation

This document explains the approach we've taken to properly separate client and server components in our Next.js application.

## Architecture

Our architecture follows these principles:

1. **Default to Server Components**: We use server components by default for all non-interactive UI.

2. **Explicit Client Boundaries**: Client components are explicitly marked with `"use client"` and grouped logically.

3. **Component Hierarchy**: Server components at the top, passing data down to client components.

4. **Unique ID Generation**:
   - Server components use `generateServerSafeId()`
   - Client components use `useUniqueId()` hook

5. **Client Boundary Pattern**: We use the `<ClientBoundary>` component to create explicit boundaries.

## Directory Structure

\`\`\`
├── components/
│   ├── auth/                 # Authentication components
│   ├── client-boundary.tsx   # Client boundary component
│   ├── dashboard/            # Dashboard components
│   └── ...
├── context/                  # React Context providers (all client components)
├── hooks/                    # Custom React hooks (all client components)
├── utils/
│   ├── client-hooks/         # Client-only hooks
│   ├── component-boundary.ts # Boundary utilities
│   ├── generate-unique-id.ts # Client-side ID generation
│   └── server-safe-id.ts     # Server-side ID generation
└── ...
\`\`\`

## Validation

We've implemented a validation script to ensure proper separation:

\`\`\`bash
npm run validate
\`\`\`

This script:
- Checks all components using hooks have the `"use client"` directive
- Warns about possible server components with client directives
- Runs automatically before builds to catch issues early

## Best Practices

1. **Move Client Components Down**: Push client components as far down the tree as possible.

2. **Share Data, Not Logic**: Pass serializable data from server to client, not functions.

3. **Server-Side Data Fetching**: Fetch data in server components when possible.

4. **Client-Side Interactivity**: Keep state management and event handlers in client components.

5. **Clear Boundaries**: Use the ClientBoundary component for explicit separation.

## Common Issues

1. **Hydration Errors**: If you see hydration errors, check that server and client render the same initial UI.

2. **Hook Errors**: If you see "hook can only be used in client component" errors, move the hook to a client component.

3. **Window/Document Usage**: Browser APIs can only be used in client components with useEffect.

## Migration Tips

When migrating existing components:

1. Identify components that need interactivity
2. Add the `"use client"` directive to those components
3. If a server component needs to render a client component, pass data via props
4. Use validation scripts to catch missed issues
