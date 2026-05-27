-- =====================================================
-- XPrize: row level security policies
-- =====================================================

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Enable RLS on every table.
alter table public.profiles          enable row level security;
alter table public.projects          enable row level security;
alter table public.contributions     enable row level security;
alter table public.project_votes     enable row level security;
alter table public.contributor_votes enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles: select authenticated" on public.profiles;
drop policy if exists "profiles: update self or admin" on public.profiles;
drop policy if exists "profiles: delete admin"         on public.profiles;

create policy "profiles: select authenticated"
  on public.profiles for select to authenticated
  using (true);

create policy "profiles: update self or admin"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "profiles: delete admin"
  on public.profiles for delete to authenticated
  using (public.is_admin());

-- ---------- projects ----------
drop policy if exists "projects: select authenticated"      on public.projects;
drop policy if exists "projects: insert"                    on public.projects;
drop policy if exists "projects: update admin or own-idea"  on public.projects;
drop policy if exists "projects: delete admin"              on public.projects;

create policy "projects: select authenticated"
  on public.projects for select to authenticated
  using (true);

-- Anyone may create a project, but non-admins must:
--   - own it (created_by = auth.uid())
--   - leave prize at $0
--   - leave status as 'open' (idea-stage)
--   - leave winner/awarded/paid blank
create policy "projects: insert"
  on public.projects for insert to authenticated
  with check (
    public.is_admin()
    or (
      created_by = auth.uid()
      and prize_cents = 0
      and status = 'open'
      and winner_id is null
      and awarded_at is null
      and prize_paid_at is null
    )
  );

-- Admin may update anything. Creator may edit their own idea while still idea-stage.
create policy "projects: update admin or own-idea"
  on public.projects for update to authenticated
  using (public.is_admin() or (created_by = auth.uid() and prize_cents = 0 and status = 'open'))
  with check (public.is_admin() or (created_by = auth.uid() and prize_cents = 0 and status = 'open'));

create policy "projects: delete admin"
  on public.projects for delete to authenticated
  using (public.is_admin());

-- ---------- contributions ----------
drop policy if exists "contributions: select authenticated"  on public.contributions;
drop policy if exists "contributions: insert self"           on public.contributions;
drop policy if exists "contributions: update self or admin"  on public.contributions;
drop policy if exists "contributions: delete self or admin"  on public.contributions;

create policy "contributions: select authenticated"
  on public.contributions for select to authenticated
  using (true);

create policy "contributions: insert self"
  on public.contributions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.status in ('open','in_progress','judging')
        and p.prize_cents > 0
    )
  );

create policy "contributions: update self or admin"
  on public.contributions for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "contributions: delete self or admin"
  on public.contributions for delete to authenticated
  using (
    public.is_admin()
    or (
      user_id = auth.uid()
      and exists (
        select 1 from public.projects p
        where p.id = project_id and p.status in ('open','in_progress')
      )
    )
  );

-- ---------- project_votes ----------
drop policy if exists "pv: select authenticated"  on public.project_votes;
drop policy if exists "pv: insert self"           on public.project_votes;
drop policy if exists "pv: delete self"           on public.project_votes;

create policy "pv: select authenticated"
  on public.project_votes for select to authenticated
  using (true);

create policy "pv: insert self"
  on public.project_votes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.status in ('open','in_progress')
    )
  );

create policy "pv: delete self"
  on public.project_votes for delete to authenticated
  using (user_id = auth.uid());

-- ---------- contributor_votes ----------
drop policy if exists "cv: select authenticated"  on public.contributor_votes;
drop policy if exists "cv: insert self"           on public.contributor_votes;
drop policy if exists "cv: update self"           on public.contributor_votes;
drop policy if exists "cv: delete self or admin"  on public.contributor_votes;

create policy "cv: select authenticated"
  on public.contributor_votes for select to authenticated
  using (true);

-- Trigger check_judging_status enforces status='judging' on insert.
create policy "cv: insert self"
  on public.contributor_votes for insert to authenticated
  with check (voter_id = auth.uid());

create policy "cv: update self"
  on public.contributor_votes for update to authenticated
  using (voter_id = auth.uid())
  with check (voter_id = auth.uid());

create policy "cv: delete self or admin"
  on public.contributor_votes for delete to authenticated
  using (voter_id = auth.uid() or public.is_admin());
