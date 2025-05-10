-- Function to migrate user data from one user to another
CREATE OR REPLACE FUNCTION migrate_user_data(source_id UUID, target_id UUID)
RETURNS VOID AS $$
DECLARE
  table_record RECORD;
  query TEXT;
BEGIN
  -- Migrate wellness_entries
  UPDATE wellness_entries
  SET user_id = target_id
  WHERE user_id = source_id;
  
  -- Migrate goals
  UPDATE goals
  SET user_id = target_id
  WHERE user_id = source_id;
  
  -- Migrate categories
  UPDATE categories
  SET user_id = target_id
  WHERE user_id = source_id;
  
  -- Migrate user_preferences
  UPDATE user_preferences
  SET user_id = target_id
  WHERE user_id = source_id;
  
  -- Migrate any other tables with user_id column
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name NOT IN ('wellness_entries', 'goals', 'categories', 'user_preferences', 'profiles')
  LOOP
    -- Check if the table has a user_id column
    PERFORM column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = table_record.table_name 
    AND column_name = 'user_id';
    
    IF FOUND THEN
      query := format('UPDATE %I SET user_id = %L WHERE user_id = %L', 
                     table_record.table_name, target_id, source_id);
      EXECUTE query;
    END IF;
  END LOOP;
  
  -- Finally, update the profile if it exists
  UPDATE profiles
  SET id = target_id
  WHERE id = source_id
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = target_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies to ensure proper access
ALTER FUNCTION migrate_user_data(UUID, UUID) SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION migrate_user_data TO authenticated;

-- Create a trigger to automatically migrate data when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  anonymous_id TEXT;
BEGIN
  -- Check if there's an anonymous ID stored in user metadata
  anonymous_id := NEW.raw_user_meta_data->>'anonymous_id';
  
  -- If there is an anonymous ID, migrate the data
  IF anonymous_id IS NOT NULL AND anonymous_id != '' THEN
    PERFORM migrate_user_data(anonymous_id::UUID, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
