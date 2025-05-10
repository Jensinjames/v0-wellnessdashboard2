# TypeScript Generics in JSX Files

This guide explains how to properly use TypeScript generics in JSX/TSX files to avoid syntax errors and deployment issues.

## Common Issues

When using TypeScript generics in JSX files, the angle brackets (`<>`) can be confused with JSX tags, leading to syntax errors and deployment failures.

## Best Practices

### 1. Add a space after the opening angle bracket

\`\`\`tsx
// ❌ Problematic - can be confused with JSX tag
const result = useQuery<UserData>(queryFn);

// ✅ Better - space makes it clearer
const result = useQuery< UserData>(queryFn);
\`\`\`

### 2. Use the `extends unknown` pattern

\`\`\`tsx
// ✅ Best practice - clearly indicates this is a type parameter
const result = useQuery<UserData extends unknown>(queryFn);
\`\`\`

### 3. Use type assertions instead when possible

\`\`\`tsx
// ✅ Alternative approach using type assertion
const result = useQuery(queryFn) as QueryResult<UserData>;
\`\`\`

### 4. Define type parameters separately

\`\`\`tsx
// ✅ Define the type parameter separately
type UserQueryResult = QueryResult<UserData>;
const result = useQuery(queryFn) as UserQueryResult;
\`\`\`

## Examples for Common Hooks

### For custom hooks

\`\`\`tsx
// ❌ Avoid
function useCustomHook<T>(data: T) { ... }

// ✅ Recommended
function useCustomHook<T extends unknown>(data: T) { ... }
\`\`\`

### For React.useState

\`\`\`tsx
// ❌ Avoid
const [data, setData] = useState<Data>([]);

// ✅ Recommended
const [data, setData] = useState<Data extends unknown>([]);
// Or
const [data, setData] = useState([] as Data);
\`\`\`

## Fixing Deployment Errors

If you encounter deployment errors related to unbalanced tags in TypeScript generics:

1. Look for generic type parameters in your code (`<T>`)
2. Apply one of the patterns above to fix the issue
3. Run `npm run lint:tsx` to check for similar issues
4. Use the `// @ts-expect-error` comment if needed for temporary fixes

## IDE Configuration

Configure your IDE to highlight JSX syntax issues:

- VS Code: Install the ESLint extension and enable "ESLint: Fix on Save"
- WebStorm: Enable "ESLint" in the quality tools section

Remember that proper TypeScript generic syntax in JSX files is crucial for successful builds and deployments.
\`\`\`

Let's create a VS Code settings file to help catch these issues early:
