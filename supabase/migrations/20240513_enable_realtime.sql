-- Enable real-time for all tables
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table entries;
alter publication supabase_realtime add table goals;
alter publication supabase_realtime add table users;

-- Add a trigger to handle deletions for real-time
create or replace function public.handle_deleted_record()
returns trigger as $$
begin
  -- Add the deleted record to the outgoing payload
  -- with a special "__deleted" field set to true
  old.__deleted := true;
  return old;
end;
$$ language plpgsql security definer;

-- Create triggers for each table
create trigger on_category_deleted
  after delete on public.categories
  for each row execute procedure public.handle_deleted_record();

create trigger on_entry_deleted
  after delete on public.entries
  for each row execute procedure public.handle_deleted_record();

create trigger on_goal_deleted
  after delete on public.goals
  for each row execute procedure public.handle_deleted_record();

create trigger on_user_deleted
  after delete on public.users
  for each row execute procedure public.handle_deleted_record();
