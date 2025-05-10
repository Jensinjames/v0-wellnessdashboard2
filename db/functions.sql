-- ===============================
-- WELLNESS DASHBOARD FUNCTIONS
-- ===============================

-- Function to get complete dashboard data for a user
CREATE OR REPLACE FUNCTION get_dashboard_data(
  p_user_id UUID,
  p_timeframe TEXT DEFAULT 'week',
  p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to update a goal with proper validation
CREATE OR REPLACE FUNCTION update_wellness_goal(
  p_user_id UUID,
  p_category TEXT,
  p_goal_hours NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to add a wellness entry with category validation
CREATE OR REPLACE FUNCTION add_wellness_entry(
  p_user_id UUID,
  p_category TEXT,
  p_activity TEXT,
  p_duration NUMERIC,
  p_notes TEXT DEFAULT NULL,
  p_timestamp TIMESTAMP DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_category_exists BOOLEAN;
  v_entry_id UUID;
  v_result JSONB;
BEGIN
  -- Validate category exists
  SELECT EXISTS(
    SELECT 1 FROM wellness_categories
    WHERE id = p_category AND (user_id = p_user_id OR user_id IS NULL)
  ) INTO v_category_exists;

  -- If category doesn't exist, return error
  IF NOT v_category_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Category does not exist or you do not have access to it',
      'code', 'CATEGORY_NOT_FOUND'
    );
  END IF;

  -- Insert entry
  INSERT INTO wellness_entries (
    user_id,
    category,
    activity,
    duration,
    notes,
    timestamp,
    created_at
  )
  VALUES (
    p_user_id,
    p_category,
    p_activity,
    p_duration,
    p_notes,
    p_timestamp,
    NOW()
  )
  RETURNING id INTO v_entry_id;

  -- Get the complete entry
  SELECT jsonb_build_object(
    'id', e.id,
    'category', e.category,
    'activity', e.activity,
    'duration', e.duration,
    'notes', e.notes,
    'timestamp', e.timestamp,
    'created_at', e.created_at,
    'category_name', c.name,
    'category_color', c.color
  )
  FROM wellness_entries e
  JOIN wellness_categories c ON e.category = c.id
  WHERE e.id = v_entry_id
  INTO v_result;

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
$$;

-- Function to manage categories (create, update, delete)
CREATE OR REPLACE FUNCTION manage_wellness_category(
  p_user_id UUID,
  p_action TEXT, -- 'create', 'update', 'delete'
  p_category_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_category_id TEXT;
  v_result JSONB;
BEGIN
  -- Extract category ID for update/delete operations
  v_category_id := p_category_data->>'id';
  
  -- Perform the requested action
  CASE p_action
    WHEN 'create' THEN
      INSERT INTO wellness_categories (
        name,
        description,
        color,
        icon,
        user_id,
        created_at,
        updated_at
      )
      VALUES (
        p_category_data->>'name',
        p_category_data->>'description',
        p_category_data->>'color',
        p_category_data->>'icon',
        p_user_id,
        NOW(),
        NOW()
      )
      RETURNING jsonb_build_object(
        'id', id,
        'name', name,
        'color', color,
        'icon', icon,
        'created_at', created_at
      ) INTO v_result;
      
      RETURN jsonb_build_object(
        'success', true,
        'data', v_result,
        'action', 'created'
      );
      
    WHEN 'update' THEN
      -- Verify ownership
      IF NOT EXISTS (
        SELECT 1 FROM wellness_categories
        WHERE id = v_category_id AND user_id = p_user_id
      ) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Category not found or you do not have permission to update it',
          'code', 'PERMISSION_DENIED'
        );
      END IF;
      
      UPDATE wellness_categories
      SET
        name = COALESCE(p_category_data->>'name', name),
        description = COALESCE(p_category_data->>'description', description),
        color = COALESCE(p_category_data->>'color', color),
        icon = COALESCE(p_category_data->>'icon', icon),
        updated_at = NOW()
      WHERE id = v_category_id AND user_id = p_user_id
      RETURNING jsonb_build_object(
        'id', id,
        'name', name,
        'color', color,
        'icon', icon,
        'updated_at', updated_at
      ) INTO v_result;
      
      RETURN jsonb_build_object(
        'success', true,
        'data', v_result,
        'action', 'updated'
      );
      
    WHEN 'delete' THEN
      -- Verify ownership
      IF NOT EXISTS (
        SELECT 1 FROM wellness_categories
        WHERE id = v_category_id AND user_id = p_user_id
      ) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Category not found or you do not have permission to delete it',
          'code', 'PERMISSION_DENIED'
        );
      END IF;
      
      -- Check if category is in use
      IF EXISTS (
        SELECT 1 FROM wellness_entries
        WHERE category = v_category_id AND user_id = p_user_id
      ) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Cannot delete category that has entries. Delete entries first or reassign them.',
          'code', 'CATEGORY_IN_USE'
        );
      END IF;
      
      -- Delete category
      DELETE FROM wellness_categories
      WHERE id = v_category_id AND user_id = p_user_id
      RETURNING jsonb_build_object(
        'id', id,
        'name', name
      ) INTO v_result;
      
      RETURN jsonb_build_object(
        'success', true,
        'data', v_result,
        'action', 'deleted'
      );
      
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid action. Must be one of: create, update, delete',
        'code', 'INVALID_ACTION'
      );
  END CASE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', SQLSTATE
    );
END;
$$;

-- Function to get user progress summary
CREATE OR REPLACE FUNCTION get_user_progress_summary(
  p_user_id UUID,
  p_timeframe TEXT DEFAULT 'week'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date TIMESTAMP;
  v_result JSONB;
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

  -- Calculate progress metrics
  SELECT jsonb_build_object(
    'summary', jsonb_build_object(
      'total_entries', COUNT(e.id),
      'total_duration', COALESCE(SUM(e.duration), 0),
      'categories_tracked', COUNT(DISTINCT e.category),
      'streak_days', (
        SELECT COUNT(DISTINCT DATE(timestamp))
        FROM wellness_entries
        WHERE user_id = p_user_id
          AND timestamp >= v_start_date
      )
    ),
    'categories', (
      SELECT jsonb_agg(cat)
      FROM (
        SELECT 
          c.id,
          c.name,
          c.color,
          COALESCE(SUM(e.duration), 0) AS total_hours,
          COALESCE(g.goal_hours, 0) AS goal_hours,
          CASE 
            WHEN g.goal_hours > 0 THEN 
              ROUND((COALESCE(SUM(e.duration), 0) / g.goal_hours) * 100, 1)
            ELSE 0
          END AS completion_percentage,
          COUNT(e.id) AS entry_count
        FROM wellness_categories c
        LEFT JOIN wellness_entries e ON c.id = e.category 
          AND e.user_id = p_user_id
          AND e.timestamp >= v_start_date
        LEFT JOIN wellness_goals g ON c.id = g.category 
          AND g.user_id = p_user_id
        WHERE c.user_id = p_user_id OR c.user_id IS NULL
        GROUP BY c.id, c.name, c.color, g.goal_hours
        ORDER BY total_hours DESC
      ) cat
    ),
    'daily_progress', (
      SELECT jsonb_agg(day)
      FROM (
        SELECT 
          DATE(timestamp) AS date,
          SUM(duration) AS total_hours,
          COUNT(id) AS entry_count,
          jsonb_object_agg(
            category, 
            SUM(duration)
          ) AS category_breakdown
        FROM wellness_entries
        WHERE user_id = p_user_id
          AND timestamp >= v_start_date
        GROUP BY DATE(timestamp)
        ORDER BY DATE(timestamp)
      ) day
    ),
    'timeframe', p_timeframe
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'code', SQLSTATE
    );
END;
$$;

-- Function to handle goal hierarchy operations
CREATE OR REPLACE FUNCTION manage_goal_hierarchy(
  p_user_id UUID,
  p_action TEXT, -- 'create_category', 'update_category', 'delete_category', 'create_subcategory', etc.
  p_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_result JSONB;
BEGIN
  -- Handle different actions
  CASE p_action
    -- Category operations
    WHEN 'create_category' THEN
      INSERT INTO goal_categories (
        name,
        description,
        color,
        icon,
        user_id,
        daily_time_allocation,
        created_at,
        updated_at
      )
      VALUES (
        p_data->>'name',
        COALESCE(p_data->>'description', ''),
        COALESCE(p_data->>'color', '#000000'),
        COALESCE(p_data->>'icon', ''),
        p_user_id,
        COALESCE((p_data->>'daily_time_allocation')::NUMERIC, 0),
        NOW(),
        NOW()
      )
      RETURNING id INTO v_id;
      
      SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'color', color,
        'created_at', created_at
      )
      FROM goal_categories
      WHERE id = v_id
      INTO v_result;
      
      RETURN jsonb_build_object(
        'success', true,
        'data', v_result,
        'action', 'category_created'
      );
      
    WHEN 'update_category' THEN
      -- Verify ownership
      IF NOT EXISTS (
        SELECT 1 FROM goal_categories
        WHERE id = (p_data->>'id')::UUID AND user_id = p_user_id
      ) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Category not found or you do not have permission to update it',
          'code', 'PERMISSION_DENIED'
        );
      END IF;
      
      UPDATE goal_categories
      SET
        name = COALESCE(p_data->>'name', name),
        description = COALESCE(p_data->>'description', description),
        color = COALESCE(p_data->>'color', color),
        icon = COALESCE(p_data->>'icon', icon),
        daily_time_allocation = COALESCE((p_data->>'daily_time_allocation')::NUMERIC, daily_time_allocation),
        updated_at = NOW()
      WHERE id = (p_data->>'id')::UUID AND user_id = p_user_id
      RETURNING jsonb_build_object(
        'id', id,
        'name', name,
        'color', color,
        'updated_at', updated_at
      ) INTO v_result;
      
      RETURN jsonb_build_object(
        'success', true,
        'data', v_result,
        'action', 'category_updated'
      );
      
    WHEN 'delete_category' THEN
      -- Verify ownership
      IF NOT EXISTS (
        SELECT 1 FROM goal_categories
        WHERE id = (p_data->>'id')::UUID AND user_id = p_user_id
      ) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Category not found or you do not have permission to delete it',
          'code', 'PERMISSION_DENIED'
        );
      END IF;
      
      -- Begin transaction for cascading delete
      BEGIN
        -- Delete all goals in all subcategories
        DELETE FROM goals
        WHERE subcategory_id IN (
          SELECT id FROM goal_subcategories
          WHERE category_id = (p_data->>'id')::UUID
        );
        
        -- Delete all subcategories
        DELETE FROM goal_subcategories
        WHERE category_id = (p_data->>'id')::UUID;
        
        -- Delete the category
        DELETE FROM goal_categories
        WHERE id = (p_data->>'id')::UUID AND user_id = p_user_id
        RETURNING jsonb_build_object(
          'id', id,
          'name', name
        ) INTO v_result;
        
        RETURN jsonb_build_object(
          'success', true,
          'data', v_result,
          'action', 'category_deleted'
        );
      EXCEPTION
        WHEN OTHERS THEN
          ROLLBACK;
          RAISE;
      END;
      
    -- Subcategory operations
    WHEN 'create_subcategory' THEN
      -- Verify category ownership
      IF NOT EXISTS (
        SELECT 1 FROM goal_categories
        WHERE id = (p_data->>'category_id')::UUID AND user_id = p_user_id
      ) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Parent category not found or you do not have permission to add to it',
          'code', 'PERMISSION_DENIED'
        );
      END IF;
      
      INSERT INTO goal_subcategories (
        name,
        description,
        category_id,
        user_id,
        daily_time_allocation,
        created_at,
        updated_at
      )
      VALUES (
        p_data->>'name',
        COALESCE(p_data->>'description', ''),
        (p_data->>'category_id')::UUID,
        p_user_id,
        COALESCE((p_data->>'daily_time_allocation')::NUMERIC, 0),
        NOW(),
        NOW()
      )
      RETURNING id INTO v_id;
      
      SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'category_id', category_id,
        'created_at', created_at
      )
      FROM goal_subcategories
      WHERE id = v_id
      INTO v_result;
      
      RETURN jsonb_build_object(
        'success', true,
        'data', v_result,
        'action', 'subcategory_created'
      );
      
    -- Goal operations
    WHEN 'create_goal' THEN
      -- Verify subcategory ownership
      IF NOT EXISTS (
        SELECT 1 FROM goal_subcategories
        WHERE id = (p_data->>'subcategory_id')::UUID AND user_id = p_user_id
      ) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Subcategory not found or you do not have permission to add to it',
          'code', 'PERMISSION_DENIED'
        );
      END IF;
      
      INSERT INTO goals (
        name,
        description,
        notes,
        subcategory_id,
        user_id,
        daily_time_allocation,
        progress,
        status,
        priority,
        due_date,
        created_at,
        updated_at
      )
      VALUES (
        p_data->>'name',
        COALESCE(p_data->>'description', ''),
        COALESCE(p_data->>'notes', ''),
        (p_data->>'subcategory_id')::UUID,
        p_user_id,
        COALESCE((p_data->>'daily_time_allocation')::NUMERIC, 0),
        COALESCE((p_data->>'progress')::NUMERIC, 0),
        COALESCE(p_data->>'status', 'not_started'),
        COALESCE(p_data->>'priority', 'medium'),
        CASE WHEN p_data->>'due_date' IS NOT NULL THEN (p_data->>'due_date')::TIMESTAMP ELSE NULL END,
        NOW(),
        NOW()
      )
      RETURNING id INTO v_id;
      
      SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'subcategory_id', subcategory_id,
        'status', status,
        'priority', priority,
        'created_at', created_at
      )
      FROM goals
      WHERE id = v_id
      INTO v_result;
      
      RETURN jsonb_build_object(
        'success', true,
        'data', v_result,
        'action', 'goal_created'
      );
      
    WHEN 'add_time_entry' THEN
      -- Verify goal ownership
      IF NOT EXISTS (
        SELECT 1 FROM goals
        WHERE id = (p_data->>'goal_id')::UUID AND user_id = p_user_id
      ) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Goal not found or you do not have permission to add time to it',
          'code', 'PERMISSION_DENIED'
        );
      END IF;
      
      INSERT INTO time_entries (
        goal_id,
        user_id,
        duration,
        date,
        notes,
        created_at
      )
      VALUES (
        (p_data->>'goal_id')::UUID,
        p_user_id,
        (p_data->>'duration')::NUMERIC,
        COALESCE((p_data->>'date')::DATE, CURRENT_DATE),
        COALESCE(p_data->>'notes', ''),
        NOW()
      )
      RETURNING id INTO v_id;
      
      -- Update goal progress
      UPDATE goals
      SET 
        progress = CASE 
          WHEN progress IS NULL THEN (p_data->>'duration')::NUMERIC
          ELSE progress + (p_data->>'duration')::NUMERIC
        END,
        updated_at = NOW()
      WHERE id = (p_data->>'goal_id')::UUID;
      
      SELECT jsonb_build_object(
        'id', t.id,
        'goal_id', t.goal_id,
        'duration', t.duration,
        'date', t.date,
        'created_at', t.created_at,
        'goal_name', g.name,
        'goal_progress', g.progress
      )
      FROM time_entries t
      JOIN goals g ON t.goal_id = g.id
      WHERE t.id = v_id
      INTO v_result;
      
      RETURN jsonb_build_object(
        'success', true,
        'data', v_result,
        'action', 'time_entry_added'
      );
      
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid action. Must be one of: create_category, update_category, delete_category, create_subcategory, create_goal, add_time_entry',
        'code', 'INVALID_ACTION'
      );
  END CASE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'code', SQLSTATE
    );
END;
$$;
