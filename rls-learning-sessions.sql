-- Bảng learning_sessions
create table if not exists public.learning_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  started_at timestamp with time zone default now() not null,
  ended_at timestamp with time zone,
  duration_seconds integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Bật RLS
alter table public.learning_sessions enable row level security;

-- Policy 1: User có thể INSERT session của chính mình
create policy "Users can insert their own learning sessions"
  on public.learning_sessions
  for insert
  with check (auth.uid() = user_id);

-- Policy 2: User có thể UPDATE session của chính mình
create policy "Users can update their own learning sessions"
  on public.learning_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy 3: User có thể SELECT session của chính mình
create policy "Users can view their own learning sessions"
  on public.learning_sessions
  for select
  using (auth.uid() = user_id);

-- Policy 4: Admins/Managers có thể SELECT tất cả
create policy "Admins and managers can view all learning sessions"
  on public.learning_sessions
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'manager')
    )
  );

-- Function và Trigger để auto update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_learning_sessions_updated_at
before update on public.learning_sessions
for each row
execute function public.handle_updated_at();
