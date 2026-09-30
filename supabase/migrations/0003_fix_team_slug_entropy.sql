-- Supabase installs pgcrypto helpers in the extensions schema.
alter function public.create_team(text) set search_path = public, extensions;
