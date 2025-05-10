-- Drop the existing function
DROP FUNCTION IF EXISTS ensure_user_role;

-- Create a corrected version of the function
CREATE OR REPLACE FUNCTION ensure_user_role(user_id UUID, role_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if the user already has the role
  -- We need to properly check if the role exists in the JSON array
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id 
    AND (
      raw_app_meta_data->'roles' @> jsonb_build_array(role_name)
      OR 
      raw_app_meta_data->'roles' IS NULL
    )
  ) THEN
    -- Add the role to the user's app_metadata
    UPDATE auth.users
    SET raw_app_meta_data = 
      CASE 
        WHEN raw_app_meta_data IS NULL THEN 
          jsonb_build_object('roles', jsonb_build_array(role_name))
        WHEN raw_app_meta_data->'roles' IS NULL THEN 
          jsonb_set(raw_app_meta_data, '{roles}', jsonb_build_array(role_name))
        ELSE 
          jsonb_set(raw_app_meta_data, '{roles}', raw_app_meta_data->'roles' || jsonb_build_array(role_name))
      END
    WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ensure_user_role TO authenticated;
