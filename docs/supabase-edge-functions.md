# Supabase Edge Functions

This document outlines the Supabase Edge Functions implemented in the Wellness Dashboard application.

## Overview

Supabase Edge Functions are serverless functions that run on Deno at the edge. They allow us to execute custom server-side logic without managing infrastructure. In this application, we use Edge Functions to:

1. Generate AI-powered insights based on wellness data
2. Process and transform data before sending it to the client
3. Implement custom business logic that requires server-side execution

## Available Edge Functions

### 1. Weekly Wellness Summary

**Endpoint:** `/weekly-wellness-summary`  
**Method:** GET  
**Authentication:** Required

This function retrieves a user's wellness data grouped by week and category, then enhances it with AI-generated insights.

**Response:**
\`\`\`json
{
  "data": [
    {
      "category": "exercise",
      "total_duration": 180,
      "entry_count": 3,
      "week_start": "2023-04-01",
      "insights": "You're making good progress with exercise activities."
    }
  ],
  "error": null
}
\`\`\`

### 2. Category Insights

**Endpoint:** `/category-insights`  
**Method:** POST  
**Authentication:** Required  
**Body:**
\`\`\`json
{
  "category": "meditation"
}
\`\`\`

This function analyzes a specific wellness category and provides personalized insights and recommendations.

**Response:**
\`\`\`json
{
  "category": "meditation",
  "insights": "You've been consistent with your meditation activities! Your average session is 15 minutes.",
  "recommendations": [
    "Set a weekly goal for meditation to track your progress",
    "Try to increase your session duration gradually",
    "Explore different types of meditation activities"
  ],
  "error": null
}
\`\`\`

## Deployment

To deploy these Edge Functions to your Supabase project:

1. Install the Supabase CLI:
   \`\`\`bash
   npm install -g supabase
   \`\`\`

2. Login to your Supabase account:
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

To run the Edge Functions locally:

1. Start the local development server:
   \`\`\`bash
   supabase start
   \`\`\`

2. Run the functions locally:
   \`\`\`bash
   supabase functions serve --env-file .env.local
   \`\`\`

3. Test the functions using curl or Postman:
   \`\`\`bash
   curl -i --location --request GET 'http://localhost:54321/functions/v1/weekly-wellness-summary' \
   --header 'Authorization: Bearer YOUR_JWT_TOKEN'
   \`\`\`

## Error Handling

All Edge Functions follow a consistent error handling pattern:

1. Authentication errors return a 401 status code
2. Validation errors return a 400 status code
3. Server errors return a 500 status code
4. All errors include an `error` field in the response with a descriptive message

## Security Considerations

- Edge Functions validate the user's JWT token to ensure they can only access their own data
- Service Role Key is used for database operations but is never exposed to the client
- CORS headers are configured to allow requests only from authorized origins
- Input validation is performed on all request parameters

## Integration with Next.js

The Edge Functions are integrated with the Next.js application through:

1. The `edge-functions-service.ts` service that provides methods to call the functions
2. React hooks that handle data fetching, loading states, and error handling
3. UI components that display the data and insights

## Troubleshooting

If you encounter issues with the Edge Functions:

1. Check the Supabase logs:
   \`\`\`bash
   supabase functions logs
   \`\`\`

2. Verify your environment variables are set correctly
3. Ensure your JWT token is valid and not expired
4. Check the CORS configuration if you're getting cross-origin errors

## Next Steps

- Add more sophisticated AI insights using OpenAI or other AI services
- Implement caching to improve performance
- Add more Edge Functions for additional features like goal recommendations
\`\`\`

Let me know if you'd like me to explain any part of the implementation in more detail or if you'd like to make any changes to the Edge Functions!
