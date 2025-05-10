-- Function to ensure a user has a specific role
CREATE OR REPLACE FUNCTION ensure_user_role(user_id UUID, role_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if the user already has the role
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id AND raw_app_meta_data->>'roles' ? role_name
  ) THEN
    -- Add the role to the user's app_metadata
    UPDATE auth.users
    SET raw_app_meta_data = 
      CASE 
        WHEN raw_app_meta_data->>'roles' IS NULL THEN 
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
