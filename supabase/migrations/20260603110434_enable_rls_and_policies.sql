-- Drop existing policies if they exist to start fresh
drop policy if exists "Users can select their own concepts" on public.concept;
drop policy if exists "Users can submit concepts" on public.concept;
drop policy if exists "Anyone can select all concepts" on public.concept;
drop policy if exists "Users can update their own concepts" on public.concept;
drop policy if exists "Admins can update all concepts" on public.concept;

-- Enable RLS on concept table
alter table public.concept enable row level security;

-- 1. SELECT: Anyone (anonymous and authenticated) can select all concepts
create policy "Anyone can select all concepts" on public.concept
  for select to anon, authenticated using (true);

-- 2. INSERT: Authenticated users can submit their own concepts
create policy "Users can submit concepts" on public.concept
  for insert to authenticated with check (auth.uid() = user_id);

-- 3. UPDATE: Users can update their own concepts
create policy "Users can update their own concepts" on public.concept
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. UPDATE: Admins can update all concepts
create policy "Admins can update all concepts" on public.concept
  for update to authenticated
  using (exists (select 1 from public.user where user_id = auth.uid() and user_role = 'admin'))
  with check (exists (select 1 from public.user where user_id = auth.uid() and user_role = 'admin'));


-- Drop existing policies for tournament_submission if they exist
drop policy if exists "Anyone can select all tournament submissions" on public.tournament_submission;
drop policy if exists "Users can insert submissions for their own concepts" on public.tournament_submission;
drop policy if exists "Admins can insert any submission" on public.tournament_submission;
drop policy if exists "Users can update their own tournament submissions" on public.tournament_submission;
drop policy if exists "Admins can update all tournament submissions" on public.tournament_submission;

-- Enable RLS on tournament_submission table
alter table public.tournament_submission enable row level security;

-- 1. SELECT: Anyone (anonymous and authenticated) can select all submissions
create policy "Anyone can select all tournament submissions" on public.tournament_submission
  for select to anon, authenticated using (true);

-- 2. INSERT: Users can submit their own concepts to tournaments
create policy "Users can insert submissions for their own concepts" on public.tournament_submission
  for insert to authenticated
  with check (exists (
    select 1 from public.concept
    where concept.concept_id = tournament_submission.concept_id
      and concept.user_id = auth.uid()
  ));

-- 3. INSERT: Admins can insert any submission (e.g. bulk seeding)
create policy "Admins can insert any submission" on public.tournament_submission
  for insert to authenticated
  with check (exists (
    select 1 from public.user
    where user_id = auth.uid()
      and user_role = 'admin'
  ));

-- 4. UPDATE: Users can update their own submissions (e.g. forfeit/delete)
create policy "Users can update their own tournament submissions" on public.tournament_submission
  for update to authenticated
  using (exists (
    select 1 from public.concept
    where concept.concept_id = tournament_submission.concept_id
      and concept.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.concept
    where concept.concept_id = tournament_submission.concept_id
      and concept.user_id = auth.uid()
  ));

-- 5. UPDATE: Admins can update all submissions (e.g. approve/reject/terminate)
create policy "Admins can update all tournament submissions" on public.tournament_submission
  for update to authenticated
  using (exists (
    select 1 from public.user
    where user_id = auth.uid()
      and user_role = 'admin'
  ))
  with check (exists (
    select 1 from public.user
    where user_id = auth.uid()
      and user_role = 'admin'
  ));
