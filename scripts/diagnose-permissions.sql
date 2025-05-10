-- Diagnose database permissions for Rollen Wellness Dashboard
-- This script identifies missing permissions that could cause DB-GRANT-001 errors

-- Check for missing RLS policies
SELECT
  schemaname,
  tablename,
  CASE WHEN has_table_privilege('authenticated', tablename, 'SELECT') THEN 'Yes' ELSE 'No' END as authenticated_select,
  CASE WHEN has_table_privilege('authenticated', tablename, 'INSERT') THEN 'Yes' ELSE 'No' END as authenticated_insert,
  CASE WHEN has_table_privilege('authenticated', tablename, 'UPDATE') THEN 'Yes' ELSE 'No' END as authenticated_update,
  CASE WHEN has_table_privilege('authenticated', tablename, 'DELETE') THEN 'Yes' ELSE 'No' END as authenticated_delete,
  CASE WHEN row_security_active(tablename) THEN 'Enabled' ELSE 'Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'categories', 'goals', 'entries', 'user_roles');

-- Check for missing role grants
SELECT 
  r.rolname, 
  ARRAY_AGG(m.rolname) AS member_of
FROM pg_roles r
LEFT JOIN pg_auth_members am ON am.member = r.oid
LEFT JOIN pg_roles m ON m.oid = am.roleid
WHERE r.rolname IN ('anon', 'authenticated', 'service_role')
GROUP BY r.rolname;
