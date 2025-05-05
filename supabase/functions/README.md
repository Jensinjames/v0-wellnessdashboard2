# Supabase Edge Functions

These Edge Functions should be deployed separately using the Supabase CLI, not as part of the Next.js build process.

## Deployment Instructions

1. Install the Supabase CLI if you haven't already:
   \`\`\`bash
   npm install -g supabase
   \`\`\`

2. Login to Supabase:
   \`\`\`bash
   supabase login
   \`\`\`

3. Link your project:
   \`\`\`bash
   supabase link --project-ref your-project-ref
   \`\`\`

4. Deploy the functions:
   \`\`\`bash
   supabase functions deploy weekly-wellness-summary
   supabase functions deploy category-insights
   \`\`\`

5. Set the required environment variables:
   \`\`\`bash
   supabase secrets set SUPABASE_URL=your-supabase-url
   supabase secrets set SUPABASE_ANON_KEY=your-anon-key
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   \`\`\`

## Local Development

To run the functions locally:

\`\`\`bash
supabase start
supabase functions serve
