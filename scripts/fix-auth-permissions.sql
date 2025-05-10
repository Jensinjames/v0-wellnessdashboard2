-- Fix Database Permissions for Authentication
-- This script addresses the DB-CONFIG-001 and DB-GRANT-001 errors

-- 1. First, check if the auth schema exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    RAISE EXCEPTION 'Auth schema does not exist. Please check your Supabase setup.';
  END IF;
END $$;

-- 2. Create the health_check table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.health_check (
  id SERIAL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'ok',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Grant permissions on the health_check table
GRANT SELECT, INSERT ON public.health_check TO anon, authenticated, service_role;
GRANT USAGE ON SEQUENCE public.health_check_id_seq TO anon, authenticated, service_role;

-- 4. Ensure the auth.users table has the correct permissions
GRANT SELECT ON auth.users TO service_role;
GRANT SELECT ON auth.users TO authenticated;

-- 5. Fix the user_changes_log issue if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_changes_log'
  ) THEN
    -- Grant permissions on the user_changes_log table
    GRANT SELECT, INSERT, UPDATE ON public.user_changes_log TO service_role;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
  END IF;
END $$;

-- 6. Ensure profiles table has correct permissions and RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    -- Enable RLS on profiles
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create policies if they don't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND policyname = 'Users can view their own profile'
    ) THEN
      CREATE POLICY "Users can view their own profile" 
        ON public.profiles 
        FOR SELECT 
        USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND policyname = 'Users can update their own profile'
    ) THEN
      CREATE POLICY "Users can update their own profile" 
        ON public.profiles 
        FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND policyname = 'Users can insert their own profile'
    ) THEN
      CREATE POLICY "Users can insert their own profile" 
        ON public.profiles 
        FOR INSERT 
        WITH CHECK (auth.uid() = id);
    END IF;
    
    -- Grant permissions
    GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
    GRANT ALL ON public.profiles TO service_role;
  END IF;
END $$;

-- 7. Fix any missing grants for the authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;

-- 8. Create a function to verify database permissions are working
CREATE OR REPLACE FUNCTION public.check_auth_permissions()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result = jsonb_build_object(
    'timestamp', now(),
    'auth_schema_exists', EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'),
    'profiles_table_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles'),
    'health_check_table_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'health_check'),
    'profiles_has_rls', EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles' AND rowsecurity = true)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant execute permission on the check function
GRANT EXECUTE ON FUNCTION public.check_auth_permissions() TO authenticated, anon, service_role;

-- 10. Run the check and return results
SELECT * FROM public.check_auth_permissions();
