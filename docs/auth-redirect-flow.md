# Authentication Redirect Flow

This document outlines the authentication redirect flow in the application, including the conditions for each redirect path and security considerations.

## Overview

The authentication redirect flow is designed to ensure users are directed to the appropriate pages based on their authentication status, profile completeness, and intended destination. The flow is implemented across multiple components:

1. **Redirect Manager** - Centralized utility for managing redirects
2. **Auth Context** - Handles authentication state and redirects after auth operations
3. **Navigation Hook** - Provides navigation utilities with redirect support
4. **Middleware** - Server-side redirect handling
5. **Auth Callback** - Handles redirects after external auth operations

## Redirect Flow

### Sign-In Flow

1. User attempts to access a protected route
2. Middleware checks authentication status
3. If not authenticated, redirects to sign-in page with `redirectTo` parameter
4. User signs in successfully
5. Auth context redirects user to:
   - The intended destination from `redirectTo` parameter
   - A stored redirect URL from session storage
   - The default dashboard page

### Sign-Up Flow

1. User signs up successfully
2. If email verification is required, user is shown verification instructions
3. After verifying email, user is redirected to:
   - Profile completion page if profile is incomplete
   - Dashboard if profile is complete

### Sign-Out Flow

1. User signs out
2. Auth context clears authentication state
3. User is redirected to sign-in page

### Profile Completion Flow

1. User with incomplete profile attempts to access a route requiring complete profile
2. Middleware redirects to profile completion page
3. After completing profile, user is redirected to the originally intended destination

## Security Considerations

### URL Validation

All redirect URLs are validated to prevent open redirect vulnerabilities:

- Only relative URLs or URLs with the same origin are allowed
- URLs are sanitized to prevent XSS attacks
- Auth pages are excluded from redirect destinations after sign-in

### State Preservation

The intended destination is preserved through multiple mechanisms:

- Query parameters (`redirectTo`)
- Session storage
- History state

### Error Handling

The redirect flow includes comprehensive error handling:

- Timeout detection for failed redirects
- Fallback destinations if intended destinations are invalid
- Logging of redirect errors

## Implementation Details

### Redirect Manager

The `redirect-manager.ts` utility provides functions for:

- Validating redirect URLs
- Determining appropriate redirect destinations
- Storing and retrieving redirect URLs
- Performing redirects with error recovery

### Navigation Hook

The `use-navigation.ts` hook provides methods for:

- Navigating with state preservation
- Handling back navigation
- Post-authentication navigation

### Middleware

The middleware handles server-side redirects based on:

- Authentication status
- Email verification status
- Profile completeness
- Route requirements

### Auth Context

The auth context manages redirects after:

- Sign-in
- Sign-up
- Sign-out
- Profile updates

## Best Practices

1. Always validate redirect URLs
2. Use the redirect manager for all redirects
3. Include fallback destinations
4. Handle redirect errors gracefully
5. Preserve user intent through redirects
6. Consider user experience in the redirect flow
\`\`\`

## 9. Let's create a redirect error boundary component:
