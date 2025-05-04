# Client and Server Component Guidelines

This document provides guidelines for working with client and server components in Next.js.

## Component Types

### Server Components (Default)
- Fetch data
- Access backend resources directly
- Keep sensitive information on the server
- Cannot use hooks or event handlers

### Client Components
- Use interactivity and event listeners
- Use React hooks
- Maintain state and lifecycle effects
- Must be explicitly marked with `"use client"` directive at the top of the file

## Best Practices

### 1. Proper Component Organization

- Keep client components in dedicated files with the `"use client"` directive
- Push client components to the leaves of your component tree
- Group client components together when possible
- Use directory structure to separate client and server components:
  \`\`\`
  components/
    client/         # All client components
    server/         # All server components 
    shared/         # Components that could be either
  \`\`\`

### 2. Data Flow

- Pass data from server components to client components via props
- Never pass functions from server to client components
- Always ensure data passed from server to client is serializable

### 3. Handling Hooks

- Always use hooks in client components only
- Create custom hooks in separate files with `"use client"` directive
- For server components that need hook functionality, split them into:
  - A server component that handles data fetching
  - A client component that handles interactivity

### 4. Client Boundaries

- Create explicit "boundary" components where needed to separate client and server rendering
- Use the `<ClientBoundary>` component to safely wrap client components from server components

### 5. Error Handling

- Use error boundaries in client components
- Handle data loading states explicitly
- Consider fallbacks for when JavaScript is disabled

### 6. ID Generation

- For server components: use `generateServerSafeId()`
- For client components: use `useUniqueId()` hook

## Common Issues and Solutions

### "useX" is not defined in Server Component

**Problem**: Using a React hook in a server component
**Solution**: Extract the code using hooks into a separate client component

### Cannot use "window" or "document" in Server Component

**Problem**: Browser APIs being used in server components 
**Solution**: Use an effect in a client component to access browser APIs

### Hydration errors

**Problem**: Server and client rendering output doesn't match
**Solution**: 
- Ensure data is passed properly from server to client
- Use `useEffect` for client-side only code
- Use keys to isolate changing content

## Helpful Patterns

### The Container/Presenter Pattern

\`\`\`tsx
// Container (Server Component)
export default async function UserProfileContainer() {
  // Fetch data on the server
  const userData = await fetchUserData();
  
  // Pass to client presenter
  return <UserProfilePresenter userData={userData} />;
}

// Presenter ("use client")
"use client"
export function UserProfilePresenter({ userData }) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Handle all interactivity
  return (
    // Interactive UI...
  );
}
\`\`\`

### The Client Boundary Pattern

\`\`\`tsx
// Server Component
export default function PageWithClientParts() {
  const serverData = fetchDataOnServer();
  
  return (
    <div>
      <ServerRenderedPart data={serverData} />
      <ClientBoundary>
        <InteractiveClientComponent initialData={serverData.clientSafePart} />
      </ClientBoundary>
    </div>
  );
}
