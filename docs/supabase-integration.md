# Supabase Integration Guide

This document outlines the architecture and best practices for integrating Supabase in the Wellness Dashboard application.

## Environment Variables

### Client-Side Variables

These variables are prefixed with `NEXT_PUBLIC_` and are safe to use in browser contexts:

- `NEXT_PUBLIC_SUPABASE_URL`: The public URL of your Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The public anon key for your Supabase project
- `NEXT_PUBLIC_SITE_URL`: The public URL of your application
- `NEXT_PUBLIC_APP_VERSION`: The current version of your application
- `NEXT_PUBLIC_APP_ENVIRONMENT`: The environment (development, production, etc.)
- `NEXT_PUBLIC_DEBUG_MODE`: Whether debug mode is enabled

### Server-Side Variables

These variables should ONLY be accessed in server contexts (API routes, server components, server actions):

- `SUPABASE_URL`: The URL of your Supabase project
- `SUPABASE_ANON_KEY`: The anon key for your Supabase project
- `SUPABASE_SERVICE_ROLE_KEY`: The service role key (admin access)
- `SUPABASE_JWT_SECRET`: The JWT secret for custom JWT verification
- `SUPABASE_EDGE_FUNCTION_URL`: URL for edge functions
- `SUPABASE_EDGE_FUNCTION_KEY`: Key for edge functions

## Client Architecture

The application uses a singleton pattern to ensure only one Supabase client instance is created:

1. `lib/supabase-singleton.ts`: Provides a true singleton pattern for the Supabase client
2. `hooks/use-supabase.ts`: React hook for using Supabase in components
3. `context/auth-context.tsx`: Authentication context provider

## Server Architecture

Server-side Supabase access is handled through:

1. `lib/supabase-server.ts`: Creates server-side Supabase clients
2. `app/api/*`: API routes that use server-side Supabase clients

## Security Considerations

1. **Environment Variables**: Server-side variables are never exposed to the client
2. **API Routes**: Sensitive operations are performed in API routes
3. **Config API**: Safe configuration is provided through a dedicated API route

## Preventing Multiple GoTrueClient Instances

The application uses a strict singleton pattern to prevent multiple GoTrueClient instances:

1. Only one Supabase client is ever created
2. The client is properly initialized before use
3. The client is reset on sign-out

## Best Practices

1. Always use the `useSupabase` hook in client components
2. Always use `createServerSupabaseClient` in server contexts
3. Never access server-side environment variables in client code
4. Use the Config API for client configuration
5. Reset the Supabase client when signing out
