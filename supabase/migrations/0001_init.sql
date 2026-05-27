-- =====================================================
-- XPrize: enums, tables, indexes, triggers
-- =====================================================

create extension if not exists "pgcrypto";

-- ---------- Enum ----------
do $$ begin
  create type project_status as enum ('open','in_progress','judging','awarded','paid');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  avatar_url  text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_is_admin_idx on public.profiles(is_admin) where is_admin = true;

-- ---------- projects ----------
create table if not exists public.projects (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  title                   text not null,
  description             text not null default '',
  status                  project_status not null default 'open',
  prize_cents             integer not null default 0 check (prize_cents >= 0),
  created_by              uuid not null references public.profiles(id) on delete restrict,
  winner_id               uuid references public.profiles(id) on delete set null,
  awarded_at              timestamptz,
  prize_paid_at           timestamptz,
  prize_paid_in_quarter   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  -- A project must have a prize before leaving idea-stage.
  -- "Idea-stage" = status='open' AND prize_cents=0. Anything past that needs a prize.
  constraint prize_required_when_active
    check (status = 'open' or prize_cents > 0)
);

create index if not exists projects_status_idx     on public.projects(status);
create index if not exists projects_created_by_idx on public.projects(created_by);
create index if not exists projects_winner_idx     on public.projects(winner_id) where winner_id is not null;
create index if not exists projects_paid_at_idx    on public.projects(prize_paid_at) where prize_paid_at is not null;

-- ---------- contributions ----------
create table if not exists public.contributions (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete restrict,
  notes       text not null check (length(notes) between 1 and 4000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists contributions_project_idx on public.contributions(project_id);
create index if not exists contributions_user_idx    on public.contributions(user_id);

-- ---------- project_votes (priority) ----------
create table if not exists public.project_votes (
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_votes_user_idx on public.project_votes(user_id);

-- ---------- contributor_votes (judging) ----------
create table if not exists public.contributor_votes (
  project_id      uuid not null references public.projects(id) on delete cascade,
  voter_id        uuid not null references public.profiles(id) on delete cascade,
  contributor_id  uuid not null references public.profiles(id) on delete restrict,
  created_at      timestamptz not null default now(),
  primary key (project_id, voter_id)
);

create index if not exists contributor_votes_project_idx     on public.contributor_votes(project_id);
create index if not exists contributor_votes_contributor_idx on public.contributor_votes(project_id, contributor_id);

-- =====================================================
-- Triggers
-- =====================================================

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists profiles_set_updated_at      on public.profiles;
drop trigger if exists projects_set_updated_at      on public.projects;
drop trigger if exists contributions_set_updated_at on public.contributions;

create trigger profiles_set_updated_at      before update on public.profiles      for each row execute function public.set_updated_at();
create trigger projects_set_updated_at      before update on public.projects      for each row execute function public.set_updated_at();
create trigger contributions_set_updated_at before update on public.contributions for each row execute function public.set_updated_at();

-- Profile auto-create on signup; domain enforcement; admin seed.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or new.email !~* '@getlivewire\.com$' then
    raise exception 'Signup restricted to @getlivewire.com addresses';
  end if;

  insert into public.profiles (id, email, full_name, is_admin)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    lower(new.email) = 'henry@getlivewire.com'
  )
  on conflict (id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Contributor votes only allowed while project is in 'judging'.
create or replace function public.check_judging_status()
returns trigger language plpgsql as $$
declare s project_status;
begin
  select status into s from public.projects where id = new.project_id;
  if s is null then
    raise exception 'Project not found';
  end if;
  if s <> 'judging' then
    raise exception 'Judging votes only allowed when project is in judging status (current: %)', s;
  end if;
  return new;
end $$;

drop trigger if exists contributor_votes_status_check on public.contributor_votes;
create trigger contributor_votes_status_check
  before insert on public.contributor_votes
  for each row execute function public.check_judging_status();
