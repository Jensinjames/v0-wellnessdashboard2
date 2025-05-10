-- 1. Drop any broken triggers/functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_created() CASCADE;

-- 2. Recreate the trigger function as a SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
-- Insert minimal profile data with error handling
BEGIN
  INSERT INTO public.profiles (
    id, 
    email,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the trigger
  RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
END;

RETURN NEW;
END;
$$;

-- 3. Attach the trigger to auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_created();

-- 4. Verify profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
email TEXT NOT NULL,
first_name TEXT,
last_name TEXT,
avatar_url TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
email_verified BOOLEAN DEFAULT FALSE,
phone TEXT,
phone_verified BOOLEAN DEFAULT FALSE,
verification_token TEXT,
verification_token_expires_at TIMESTAMPTZ
);

-- 5. Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for profiles table (drop first to avoid errors)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service role to manage all profiles
CREATE POLICY "Service role can manage all profiles"
ON public.profiles
USING (auth.role() = 'service_role');

-- 7. Create a function to manually create profiles if needed
CREATE OR REPLACE FUNCTION public.ensure_user_profile(user_id UUID, user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
profile_exists BOOLEAN;
BEGIN
-- Check if profile exists
SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO profile_exists;

-- If profile doesn't exist, create it
IF NOT profile_exists THEN
  INSERT INTO public.profiles (
    id,
    email,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    user_email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN TRUE;
END IF;

RETURN profile_exists;
END;
$$;
