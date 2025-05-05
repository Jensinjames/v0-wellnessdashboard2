# Vercel Deployment Guide

This project includes special handling for URL imports that can cause issues during deployment.

## Deployment Process

1. Push your changes to the repository
2. Vercel will automatically run the deployment process
3. The `prebuild` script will run before the build to fix URL imports
4. The build will proceed with npm instead of pnpm (configured in vercel.json)

## How the Fix Works

The `scripts/fix-url-imports-for-vercel.js` script:

1. Finds all TypeScript and JavaScript files in the project
2. Identifies files containing URL imports
3. Comments out those URL imports to prevent installation issues
4. Creates a clean .npmrc file with settings to handle URL imports

## Manual Deployment

If you need to deploy manually:

1. Run `npm run prebuild` to fix URL imports
2. Run `npm run build` to build the project
3. Deploy the built project to Vercel

## Troubleshooting

If you encounter deployment issues:

1. Check the Vercel deployment logs for errors
2. Verify that the `prebuild` script ran successfully
3. Look for files with URL imports that might not have been fixed
4. Try deploying with the Vercel CLI for more detailed logs

## Long-term Solution

For a more permanent solution:

1. Replace URL imports with proper npm packages
2. Use dynamic imports with error handling for external resources
3. Deploy Supabase Edge Functions separately and reference them by URL
\`\`\`

## 6. Create a Next.js config that handles URL imports
