-- Create user_changes_log table
CREATE TABLE IF NOT EXISTS public.user_changes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_changes_log_user_id ON public.user_changes_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_changes_log_created_at ON public.user_changes_log(created_at);

-- Add RLS policies
ALTER TABLE public.user_changes_log ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own logs
CREATE POLICY user_select_own ON public.user_changes_log 
  FOR SELECT USING (auth.uid() = user_id);
  
-- Allow users to insert their own logs
CREATE POLICY user_insert_own ON public.user_changes_log 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
-- Allow service role to do anything
CREATE POLICY service_role_all ON public.user_changes_log 
  USING (auth.jwt() ->> 'role' = 'service_role');
