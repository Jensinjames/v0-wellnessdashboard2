-- Create a simple function for heartbeat checks
CREATE OR REPLACE FUNCTION heartbeat_check()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function simply returns true
  -- It's used to verify database connectivity
  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION heartbeat_check() TO authenticated;
GRANT EXECUTE ON FUNCTION heartbeat_check() TO anon;
