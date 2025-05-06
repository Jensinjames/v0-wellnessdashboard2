-- Create wellness_categories table
CREATE TABLE IF NOT EXISTS public.wellness_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(auth_id),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create wellness_activities table
CREATE TABLE IF NOT EXISTS public.wellness_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(auth_id),
  category_id UUID NOT NULL REFERENCES public.wellness_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id, name)
);

-- Create wellness_goals table
CREATE TABLE IF NOT EXISTS public.wellness_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(auth_id),
  category_id UUID NOT NULL REFERENCES public.wellness_categories(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.wellness_activities(id) ON DELETE CASCADE,
  target_minutes INTEGER NOT NULL,
  target_frequency TEXT, -- 'daily', 'weekly', 'monthly'
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wellness_entries table for tracking time spent
CREATE TABLE IF NOT EXISTS public.wellness_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(auth_id),
  category_id UUID NOT NULL REFERENCES public.wellness_categories(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.wellness_activities(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  minutes_spent INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wellness_metrics table for tracking additional metrics
CREATE TABLE IF NOT EXISTS public.wellness_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(auth_id),
  entry_date DATE NOT NULL,
  motivation_level INTEGER, -- 0-100
  sleep_hours NUMERIC(4,2),
  daily_score INTEGER, -- 0-100
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wellness_categories_user_id ON public.wellness_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_activities_user_id ON public.wellness_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_activities_category_id ON public.wellness_activities(category_id);
CREATE INDEX IF NOT EXISTS idx_wellness_goals_user_id ON public.wellness_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_goals_category_id ON public.wellness_goals(category_id);
CREATE INDEX IF NOT EXISTS idx_wellness_entries_user_id ON public.wellness_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_entries_category_id ON public.wellness_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_wellness_entries_entry_date ON public.wellness_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_wellness_metrics_user_id ON public.wellness_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_metrics_entry_date ON public.wellness_metrics(entry_date);

-- Set up Row Level Security (RLS)
ALTER TABLE public.wellness_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wellness_categories
CREATE POLICY "Users can view their own categories" 
  ON public.wellness_categories 
  FOR SELECT 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own categories" 
  ON public.wellness_categories 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own categories" 
  ON public.wellness_categories 
  FOR UPDATE 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own categories" 
  ON public.wellness_categories 
  FOR DELETE 
  USING (auth.uid()::text = user_id::text);

-- Create RLS policies for wellness_activities
CREATE POLICY "Users can view their own activities" 
  ON public.wellness_activities 
  FOR SELECT 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own activities" 
  ON public.wellness_activities 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own activities" 
  ON public.wellness_activities 
  FOR UPDATE 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own activities" 
  ON public.wellness_activities 
  FOR DELETE 
  USING (auth.uid()::text = user_id::text);

-- Create RLS policies for wellness_goals
CREATE POLICY "Users can view their own goals" 
  ON public.wellness_goals 
  FOR SELECT 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own goals" 
  ON public.wellness_goals 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own goals" 
  ON public.wellness_goals 
  FOR UPDATE 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own goals" 
  ON public.wellness_goals 
  FOR DELETE 
  USING (auth.uid()::text = user_id::text);

-- Create RLS policies for wellness_entries
CREATE POLICY "Users can view their own entries" 
  ON public.wellness_entries 
  FOR SELECT 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own entries" 
  ON public.wellness_entries 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own entries" 
  ON public.wellness_entries 
  FOR UPDATE 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own entries" 
  ON public.wellness_entries 
  FOR DELETE 
  USING (auth.uid()::text = user_id::text);

-- Create RLS policies for wellness_metrics
CREATE POLICY "Users can view their own metrics" 
  ON public.wellness_metrics 
  FOR SELECT 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own metrics" 
  ON public.wellness_metrics 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own metrics" 
  ON public.wellness_metrics 
  FOR UPDATE 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own metrics" 
  ON public.wellness_metrics 
  FOR DELETE 
  USING (auth.uid()::text = user_id::text);
