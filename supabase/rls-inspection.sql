-- Run this in Supabase SQL Editor after applying schema.sql.
-- It verifies that RLS is enabled and owner policies exist.

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('notes', 'tags', 'note_tags', 'links', 'note_versions', 'decision_logs')
order by tablename;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('notes', 'tags', 'note_tags', 'links', 'note_versions', 'decision_logs')
order by tablename, policyname;
