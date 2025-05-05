# Deployment Guide for Wellness Dashboard

This guide explains how to deploy the Wellness Dashboard application to Vercel, addressing the URL import issues.

## Understanding the Issue

The application contains imports from URLs (e.g., `import x from 'https://...'`), which cause problems during deployment because package managers like pnpm try to treat these URLs as package names, resulting in errors like:

\`\`\`
ERR_PNPM_FETCH_404 GET https://registry.npmjs.org/https%3A: Not Found - 404
\`\`\`

## Deployment Solution

We've implemented a comprehensive solution to fix this issue:

### 1. Automated Deployment

The easiest way to deploy is to push your changes to the repository. The deployment will automatically:

1. Run the `prepare-for-deploy.sh` script
2. Fix URL imports
3. Use npm instead of pnpm
4. Build and deploy the application

### 2. Manual Deployment

To deploy manually:

\`\`\`bash
# Prepare the project for deployment
npm run prepare-deploy

# Deploy to Vercel
npm run deploy
\`\`\`

## How the Fix Works

1. **URL Import Detection**: We scan the codebase for URL imports
2. **URL Import Fixing**: We comment out URL imports and provide fallbacks
3. **Package Manager Switch**: We use npm instead of pnpm for installation
4. **Webpack Configuration**: We configure webpack to handle any remaining URL imports

## Long-Term Solutions

For a more permanent solution:

1. **Replace URL Imports**: Use npm packages instead of URL imports
2. **Use Dynamic Imports**: If you need to load from URLs, use dynamic imports with error handling
3. **Deploy Edge Functions Separately**: If using Supabase Edge Functions, deploy them separately

## Troubleshooting

If you encounter deployment issues:

1. Run `npm run find-url-imports` to identify problematic imports
2. Run `npm run fix-url-imports` to fix them
3. Check the Vercel deployment logs for specific errors
4. Ensure `string-replace-loader` is installed as a dev dependency

## Need Help?

If you continue to experience issues, please contact the development team.
\`\`\`

## 10. Create a script to check for string-replace-loader
