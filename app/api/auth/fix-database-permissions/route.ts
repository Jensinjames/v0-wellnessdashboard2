import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createLogger } from "@/utils/logger"

const logger = createLogger("FixDatabasePermissionsAPI")

// Use server-side Supabase client with service role for admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST() {
  try {
    logger.info("Attempting to fix database permissions")

    // Execute a series of SQL commands to fix permissions
    const { error: createTableError } = await supabaseAdmin.rpc("create_user_changes_log_table")

    if (createTableError) {
      logger.error("Error creating user_changes_log table:", createTableError)

      // Try direct SQL approach as fallback
      const { error: sqlError } = await supabaseAdmin
        .from("_exec_sql")
        .select("*")
        .execute(`
        CREATE TABLE IF NOT EXISTS public.user_changes_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          action TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          ip_address TEXT,
          old_values JSONB,
          new_values JSONB
        );
        
        ALTER TABLE public.user_changes_log ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own logs" ON public.user_changes_log;
        CREATE POLICY "Users can view their own logs"
          ON public.user_changes_log
          FOR SELECT
          USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can insert their own logs" ON public.user_changes_log;
        CREATE POLICY "Users can insert their own logs"
          ON public.user_changes_log
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
        
        GRANT USAGE ON SCHEMA public TO authenticated;
        GRANT SELECT, INSERT ON public.user_changes_log TO authenticated;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
      `)

      if (sqlError) {
        logger.error("Error executing SQL fix:", sqlError)
        return NextResponse.json({ error: sqlError.message }, { status: 500 })
      }
    }

    // Fix profiles table permissions if it exists
    const { error: profilesError } = await supabaseAdmin
      .from("_exec_sql")
      .select("*")
      .execute(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'profiles'
        ) THEN
          ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
          CREATE POLICY "Users can view their own profile"
            ON public.profiles
            FOR SELECT
            USING (auth.uid() = id);
          
          DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
          CREATE POLICY "Users can update their own profile"
            ON public.profiles
            FOR UPDATE
            USING (auth.uid() = id);
          
          GRANT USAGE ON SCHEMA public TO authenticated;
          GRANT SELECT, UPDATE ON public.profiles TO authenticated;
        END IF;
      END
      $$;
    `)

    if (profilesError) {
      logger.error("Error fixing profiles table permissions:", profilesError)
      // Continue anyway, as this is just an additional fix
    }

    logger.info("Successfully fixed database permissions")
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Unexpected error fixing database permissions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
