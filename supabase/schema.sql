create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text not null,
  content text not null default '',
  folder_id text,
  versions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  unique (user_id, name)
);

create table if not exists public.note_tags (
  note_id uuid not null references public.notes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_note_id uuid not null references public.notes(id) on delete cascade,
  target_title text not null,
  target_note_id uuid references public.notes(id) on delete set null
);

create table if not exists public.note_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.decision_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  date date not null default current_date,
  category text not null default 'その他',
  decision text not null default '',
  alternatives text not null default '',
  reason text not null default '',
  result text not null default '',
  evaluation text not null default '保留',
  tags text[] not null default '{}'::text[],
  related_note_ids uuid[] not null default '{}'::uuid[],
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.notes enable row level security;
alter table public.tags enable row level security;
alter table public.note_tags enable row level security;
alter table public.links enable row level security;
alter table public.note_versions enable row level security;
alter table public.decision_logs enable row level security;

create policy "notes owner access" on public.notes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tags owner access" on public.tags
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "links owner access" on public.links
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "note_tags owner access" on public.note_tags
  for all using (
    exists (
      select 1 from public.notes
      where notes.id = note_tags.note_id and notes.user_id = auth.uid()
    ) and exists (
      select 1 from public.tags
      where tags.id = note_tags.tag_id and tags.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.notes
      where notes.id = note_tags.note_id and notes.user_id = auth.uid()
    ) and exists (
      select 1 from public.tags
      where tags.id = note_tags.tag_id and tags.user_id = auth.uid()
    )
  );

create policy "note_versions owner access" on public.note_versions
  for all using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id and exists (
      select 1 from public.notes
      where notes.id = note_versions.note_id and notes.user_id = auth.uid()
    )
  );

create policy "decision_logs owner access" on public.decision_logs
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index if not exists notes_user_title_idx on public.notes (user_id, title);
create index if not exists links_source_idx on public.links (source_note_id);
create index if not exists links_target_title_idx on public.links (user_id, target_title);
create index if not exists decision_logs_user_date_idx on public.decision_logs (user_id, date desc);
create index if not exists decision_logs_user_category_idx on public.decision_logs (user_id, category);
create index if not exists decision_logs_user_tags_idx on public.decision_logs using gin (tags);
