-- OAuth 2.1 authorization-code support and scoped read access for the MCP server.
create table public.mcp_oauth_clients (
  client_id text primary key,
  client_name text not null default 'ChatGPT',
  redirect_uris jsonb not null,
  created_at timestamptz not null default now()
);

create table public.mcp_oauth_codes (
  code_hash text primary key,
  client_id text not null references public.mcp_oauth_clients(client_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  redirect_uri text not null,
  code_challenge text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.mcp_access_tokens (
  token_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.mcp_oauth_clients enable row level security;
alter table public.mcp_oauth_codes enable row level security;
alter table public.mcp_access_tokens enable row level security;

create or replace function public.mcp_register_client(
  requested_name text,
  requested_redirect_uris jsonb
) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare new_client_id text := 'tme_' || encode(gen_random_bytes(18), 'hex');
begin
  if jsonb_typeof(requested_redirect_uris) <> 'array'
     or jsonb_array_length(requested_redirect_uris) < 1
     or jsonb_array_length(requested_redirect_uris) > 10 then
    raise exception 'One to ten redirect URIs are required';
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(requested_redirect_uris) uri
    where uri !~ '^https://[^[:space:]]+$'
      and uri !~ '^http://(127\.0\.0\.1|localhost)(:[0-9]+)?/[^[:space:]]*$'
  ) then raise exception 'Invalid redirect URI'; end if;
  insert into public.mcp_oauth_clients(client_id, client_name, redirect_uris)
  values (new_client_id, left(coalesce(nullif(trim(requested_name), ''), 'ChatGPT'), 120), requested_redirect_uris);
  return new_client_id;
end;
$$;

create or replace function public.mcp_client_is_valid(
  requested_client_id text,
  requested_redirect_uri text
) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.mcp_oauth_clients
    where client_id = requested_client_id
      and redirect_uris ? requested_redirect_uri
  );
$$;

create or replace function public.mcp_issue_code(
  requested_client_id text,
  requested_redirect_uri text,
  requested_code_challenge text,
  requested_team_id uuid
) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare raw_code text := 'tmec_' || encode(gen_random_bytes(32), 'hex');
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if requested_code_challenge !~ '^[A-Za-z0-9_-]{43,128}$' then
    raise exception 'PKCE S256 is required';
  end if;
  if not public.mcp_client_is_valid(requested_client_id, requested_redirect_uri) then
    raise exception 'Invalid OAuth client or redirect URI';
  end if;
  if not public.is_team_member(requested_team_id) then raise exception 'Workspace access denied'; end if;
  delete from public.mcp_oauth_codes where expires_at < now();
  insert into public.mcp_oauth_codes(code_hash, client_id, user_id, team_id, redirect_uri, code_challenge, expires_at)
  values (encode(digest(raw_code, 'sha256'), 'hex'), requested_client_id, auth.uid(), requested_team_id,
          requested_redirect_uri, requested_code_challenge, now() + interval '10 minutes');
  return raw_code;
end;
$$;

create or replace function public.mcp_exchange_code(
  raw_code text,
  requested_client_id text,
  requested_redirect_uri text,
  code_verifier text
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare matched public.mcp_oauth_codes%rowtype;
declare verifier_digest text;
declare raw_token text := 'tme_at_' || encode(gen_random_bytes(32), 'hex');
begin
  select * into matched from public.mcp_oauth_codes
  where code_hash = encode(digest(raw_code, 'sha256'), 'hex') for update;
  if matched.code_hash is null or matched.expires_at < now()
     or matched.client_id <> requested_client_id
     or matched.redirect_uri <> requested_redirect_uri then
    raise exception 'Invalid or expired authorization code';
  end if;
  verifier_digest := rtrim(translate(encode(digest(code_verifier, 'sha256'), 'base64'), '+/', '-_'), '=');
  if verifier_digest <> matched.code_challenge then raise exception 'Invalid PKCE verifier'; end if;
  delete from public.mcp_oauth_codes where code_hash = matched.code_hash;
  insert into public.mcp_access_tokens(token_hash, user_id, team_id, expires_at)
  values (encode(digest(raw_token, 'sha256'), 'hex'), matched.user_id, matched.team_id, now() + interval '30 days');
  return jsonb_build_object('access_token', raw_token, 'expires_in', 2592000);
end;
$$;

create or replace function public.mcp_snapshot(
  raw_token text,
  target_month date,
  expense_limit integer default 50
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare token_row public.mcp_access_tokens%rowtype;
declare result jsonb;
begin
  select * into token_row from public.mcp_access_tokens
  where token_hash = encode(digest(raw_token, 'sha256'), 'hex')
    and expires_at > now();
  if token_row.token_hash is null then raise exception 'Invalid or expired access token'; end if;
  if not exists (select 1 from public.team_members where team_id = token_row.team_id and user_id = token_row.user_id) then
    raise exception 'Workspace access revoked';
  end if;
  select jsonb_build_object(
    'team', jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug),
    'role', tm.role,
    'month', target_month,
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name,
        'approved', coalesce(b.approved_amount, 0),
        'committed', coalesce((select sum(e.amount) from public.expenses e where e.team_id = t.id and e.category_id = c.id and e.month = target_month and e.status = 'committed'), 0),
        'actual', coalesce((select sum(e.amount) from public.expenses e where e.team_id = t.id and e.category_id = c.id and e.month = target_month and e.status = 'actual'), 0)
      ) order by c.name)
      from public.categories c left join public.budgets b
        on b.team_id = t.id and b.category_id = c.id and b.month = target_month
      where c.team_id = t.id
    ), '[]'::jsonb),
    'expenses', coalesce((
      select jsonb_agg(row_data order by expense_date desc, created_at desc)
      from (
        select jsonb_build_object('id', e.id, 'vendor', e.vendor, 'description', e.description,
          'amount', e.amount, 'expense_date', e.expense_date, 'status', e.status,
          'category', c.name, 'notes', e.notes) row_data, e.expense_date, e.created_at
        from public.expenses e join public.categories c on c.id = e.category_id and c.team_id = e.team_id
        where e.team_id = t.id and e.month = target_month
        order by e.expense_date desc, e.created_at desc limit greatest(1, least(expense_limit, 100))
      ) recent
    ), '[]'::jsonb)
  ) into result
  from public.teams t join public.team_members tm on tm.team_id = t.id and tm.user_id = token_row.user_id
  where t.id = token_row.team_id;
  return result;
end;
$$;

revoke all on function public.mcp_register_client(text, jsonb) from public;
revoke all on function public.mcp_client_is_valid(text, text) from public;
revoke all on function public.mcp_issue_code(text, text, text, uuid) from public;
revoke all on function public.mcp_exchange_code(text, text, text, text) from public;
revoke all on function public.mcp_snapshot(text, date, integer) from public;
grant execute on function public.mcp_register_client(text, jsonb) to anon, authenticated;
grant execute on function public.mcp_client_is_valid(text, text) to anon, authenticated;
grant execute on function public.mcp_issue_code(text, text, text, uuid) to authenticated;
grant execute on function public.mcp_exchange_code(text, text, text, text) to anon, authenticated;
grant execute on function public.mcp_snapshot(text, date, integer) to anon, authenticated;
