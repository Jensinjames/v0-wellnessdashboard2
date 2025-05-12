-- Add indexes for performance optimization

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories (name);

-- Entries table indexes
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries (user_id);
CREATE INDEX IF NOT EXISTS idx_entries_category_id ON entries (category_id);
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries (date);
CREATE INDEX IF NOT EXISTS idx_entries_user_id_date ON entries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_category_id_date ON entries (category_id, date);

-- Goals table indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals (user_id);
CREATE INDEX IF NOT EXISTS idx_goals_category_id ON goals (category_id);
CREATE INDEX IF NOT EXISTS idx_goals_start_date ON goals (start_date);
CREATE INDEX IF NOT EXISTS idx_goals_end_date ON goals (end_date);

-- Create stored procedure for entry statistics
CREATE OR REPLACE FUNCTION get_entry_stats_by_category(
  user_id_param UUID,
  start_date_param DATE DEFAULT NULL,
  end_date_param DATE DEFAULT NULL,
  category_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  total_duration BIGINT,
  entry_count BIGINT,
  avg_duration NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS category_id,
    c.name AS category_name,
    COALESCE(SUM(e.duration), 0) AS total_duration,
    COUNT(e.id) AS entry_count,
    CASE 
      WHEN COUNT(e.id) > 0 THEN ROUND(AVG(e.duration), 2)
      ELSE 0
    END AS avg_duration
  FROM 
    categories c
  LEFT JOIN 
    entries e ON c.id = e.category_id
    AND e.user_id = user_id_param
    AND (start_date_param IS NULL OR e.date >= start_date_param)
    AND (end_date_param IS NULL OR e.date <= end_date_param)
  WHERE 
    c.user_id = user_id_param
    AND (category_id_param IS NULL OR c.id = category_id_param)
  GROUP BY 
    c.id, c.name
  ORDER BY 
    total_duration DESC;
END;
$$;
