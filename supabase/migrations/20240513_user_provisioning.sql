-- Create a function to handle user provisioning
CREATE OR REPLACE FUNCTION public.handle_user_provisioning(
  user_id UUID,
  user_email TEXT,
  user_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Using security definer to ensure function runs with owner privileges
SET search_path = public
AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  -- Check if user already exists in the users table
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = user_id
  ) INTO profile_exists;
  
  -- If user doesn't exist, create profile
  IF NOT profile_exists THEN
    INSERT INTO public.users (
      id,
      email,
      name,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      user_email,
      COALESCE(user_name, split_part(user_email, '@', 1)),
      NOW(),
      NOW()
    );
    
    -- Create default categories for new user
    INSERT INTO public.categories (
      name,
      color,
      icon,
      description,
      user_id,
      created_at
    ) VALUES 
    ('Faith', '#4F46E5', 'heart', 'Spiritual activities and practices', user_id, NOW()),
    ('Life', '#10B981', 'users', 'Family and social activities', user_id, NOW()),
    ('Work', '#F59E0B', 'briefcase', 'Professional and career activities', user_id, NOW()),
    ('Health', '#EF4444', 'activity', 'Physical and mental wellness', user_id, NOW());
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (in a real application, you might want to log to a table)
    RAISE NOTICE 'Error in handle_user_provisioning: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Create a trigger function to automatically provision users after signup
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the user provisioning function
  PERFORM public.handle_user_provisioning(
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name'
  );
  
  RETURN NEW;
END;
$$;

-- Create a trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- Function to update user password (for demonstration purposes)
-- In practice, password management is handled by Supabase Auth
CREATE OR REPLACE FUNCTION public.update_user_password(
  user_id UUID,
  new_password_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This is a simplified example
  -- In a real application, you would use Supabase Auth APIs
  -- to update passwords, not direct DB access
  UPDATE auth.users
  SET encrypted_password = new_password_hash
  WHERE id = user_id;
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in update_user_password: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Function to assign dashboard_user role
CREATE OR REPLACE FUNCTION public.assign_dashboard_user_role(
  user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Insert into user_roles table (assuming this table exists)
  -- If it doesn't exist, you would need to create it
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (user_id, 'dashboard_user', NOW())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in assign_dashboard_user_role: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Add RLS policies for user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own roles
CREATE POLICY "Users can read their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow only administrators to insert/update roles
CREATE POLICY "Only administrators can manage roles"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'administrator'
    )
  );
