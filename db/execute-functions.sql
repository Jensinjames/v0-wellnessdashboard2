-- Execute this SQL to create the database functions
-- First, check if the functions already exist
DO $$
DECLARE
  function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_dashboard_data'
  ) INTO function_exists;
  
  IF function_exists THEN
    RAISE NOTICE 'Functions already exist. Skipping creation.';
  ELSE
    -- Create get_dashboard_data function
    CREATE OR REPLACE FUNCTION get_dashboard_data(
      p_user_id UUID,
      p_timeframe TEXT DEFAULT 'week',
      p_limit INTEGER DEFAULT 50
    )
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $func$
    DECLARE
      v_start_date TIMESTAMP;
      v_entries JSONB;
      v_goals JSONB;
      v_categories JSONB;
      v_stats JSONB;
    BEGIN
      -- Set date range based on timeframe
      CASE p_timeframe
        WHEN 'day' THEN
          v_start_date := CURRENT_DATE;
        WHEN 'week' THEN
          v_start_date := CURRENT_DATE - INTERVAL '7 days';
        WHEN 'month' THEN
          v_start_date := CURRENT_DATE - INTERVAL '30 days';
        WHEN 'year' THEN
          v_start_date := CURRENT_DATE - INTERVAL '365 days';
        ELSE
          v_start_date := CURRENT_DATE - INTERVAL '7 days';
      END CASE;

      -- Get entries
      SELECT jsonb_agg(e)
      FROM (
        SELECT *
        FROM wellness_entries
        WHERE user_id = p_user_id
          AND timestamp >= v_start_date
        ORDER BY timestamp DESC
        LIMIT p_limit
      ) e INTO v_entries;

      -- Get goals
      SELECT jsonb_agg(g)
      FROM (
        SELECT *
        FROM wellness_goals
        WHERE user_id = p_user_id
      ) g INTO v_goals;

      -- Get categories (including system categories)
      SELECT jsonb_agg(c)
      FROM (
        SELECT *
        FROM wellness_categories
        WHERE user_id = p_user_id OR user_id IS NULL
        ORDER BY name
      ) c INTO v_categories;

      -- Calculate summary statistics
      SELECT jsonb_build_object(
        'total_entries', COUNT(e.id),
        'total_duration', COALESCE(SUM(e.duration), 0),
        'categories_count', COUNT(DISTINCT e.category),
        'completion_rate', CASE 
          WHEN COUNT(g.id) > 0 THEN 
            ROUND((SUM(CASE WHEN e.duration >= g.goal_hours THEN 1 ELSE 0 END)::NUMERIC / COUNT(g.id)) * 100, 2)
          ELSE 0
        END
      )
      FROM wellness_goals g
      LEFT JOIN (
        SELECT category, SUM(duration) as duration
        FROM wellness_entries
        WHERE user_id = p_user_id AND timestamp >= v_start_date
        GROUP BY category
      ) e ON g.category = e.category
      WHERE g.user_id = p_user_id
      INTO v_stats;

      -- Return combined data
      RETURN jsonb_build_object(
        'entries', COALESCE(v_entries, '[]'::jsonb),
        'goals', COALESCE(v_goals, '[]'::jsonb),
        'categories', COALESCE(v_categories, '[]'::jsonb),
        'stats', COALESCE(v_stats, '{}'::jsonb),
        'timeframe', p_timeframe
      );
    END;
    $func$;

    -- Create update_wellness_goal function
    CREATE OR REPLACE FUNCTION update_wellness_goal(
      p_user_id UUID,
      p_category TEXT,
      p_goal_hours NUMERIC,
      p_notes TEXT DEFAULT NULL
    )
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $func$
    DECLARE
      v_goal_id UUID;
      v_result JSONB;
    BEGIN
      -- Check if goal exists
      SELECT id INTO v_goal_id
      FROM wellness_goals
      WHERE user_id = p_user_id AND category = p_category;

      -- Update or insert goal
      IF v_goal_id IS NOT NULL THEN
        -- Update existing goal
        UPDATE wellness_goals
        SET 
          goal_hours = p_goal_hours,
          notes = COALESCE(p_notes, notes),
          updated_at = NOW()
        WHERE id = v_goal_id
        RETURNING jsonb_build_object(
          'id', id,
          'category', category,
          'goal_hours', goal_hours,
          'updated_at', updated_at
        ) INTO v_result;
      ELSE
        -- Create new goal
        INSERT INTO wellness_goals (
          user_id,
          category,
          goal_hours,
          notes,
          created_at,
          updated_at
        )
        VALUES (
          p_user_id,
          p_category,
          p_goal_hours,
          p_notes,
          NOW(),
          NOW()
        )
        RETURNING jsonb_build_object(
          'id', id,
          'category', category,
          'goal_hours', goal_hours,
          'created_at', created_at
        ) INTO v_result;
      END IF;

      RETURN jsonb_build_object(
        'success', true,
        'data', v_result
      );
    EXCEPTION
      WHEN OTHERS THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', SQLERRM,
          'code', SQLSTATE
        );
    END;
    $func$;

    RAISE NOTICE 'Database functions created successfully.';
  END IF;
END $$;
