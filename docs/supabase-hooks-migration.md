# Supabase Hooks Migration Guide

## Deprecation of `use-optimized-supabase.ts`

The `hooks/use-optimized-supabase.ts` hook has been deprecated and removed due to:

1. **Redundancy**: Its functionality overlapped with `use-supabase.ts` and `use-batched-supabase.ts`
2. **Complexity**: It contained complex state management that was difficult to maintain
3. **Performance**: The hook created unnecessary re-renders and memory usage

## Migration Path

### For Basic Queries

Replace:
\`\`\`typescript
const { executeQuery } = useOptimizedSupabase();

const data = await executeQuery((supabase) => 
  supabase.from('table').select('*')
);
\`\`\`

With:
\`\`\`typescript
const { query } = useSupabase();

const data = await query((supabase) => 
  supabase.from('table').select('*')
);
\`\`\`

### For Queries with Retries and Timeouts

Replace:
\`\`\`typescript
const { executeQuery } = useOptimizedSupabase();

const data = await executeQuery(
  (supabase) => supabase.from('table').select('*'),
  { retry: true, maxRetries: 3, timeout: 5000 }
);
\`\`\`

With:
\`\`\`typescript
const { executeQuery } = useSupabaseQuery();

const data = await executeQuery(
  (supabase) => supabase.from('table').select('*'),
  { retry: true, maxRetries: 3, timeout: 5000 }
);
\`\`\`

### For Batched Queries

Replace:
\`\`\`typescript
const { useQuery } = useOptimizedSupabase();

const { data, isLoading } = useQuery(
  (supabase) => supabase.from('table').select('*')
);
\`\`\`

With:
\`\`\`typescript
const { executeBatched } = useBatchedSupabase();

// For one-time execution:
const data = await executeBatched(
  () => supabase.from('table').select('*')
);

// For React Query integration:
const { data, isLoading } = useQuery({
  queryKey: ['table'],
  queryFn: () => executeBatched(
    () => supabase.from('table').select('*')
  )
});
\`\`\`

## Benefits of Migration

1. **Simplified Code**: Clearer separation of concerns
2. **Better Performance**: Reduced memory usage and fewer re-renders
3. **Improved Maintainability**: Easier to understand and debug
4. **Type Safety**: Better TypeScript inference
\`\`\`

Let's also create a utility to help identify usage of the deprecated hook:
