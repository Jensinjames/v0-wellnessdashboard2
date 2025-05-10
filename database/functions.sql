-- Function to increment login count
CREATE OR REPLACE FUNCTION increment_login_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Get the current count
  SELECT login_count INTO current_count FROM profiles WHERE id = user_id;
  
  -- If null, set to 0
  IF current_count IS NULL THEN
    current_count := 0;
  END IF;
  
  -- Return incremented count
  RETURN current_count + 1;
END;
$$ LANGUAGE plpgsql;
