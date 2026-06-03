-- Drop insecure policies on public.tournament
drop policy if exists "Enable insert for authenticated users only" on public.tournament;
drop policy if exists "update" on public.tournament;

-- Create secure admin-only policies on public.tournament
create policy "Admins can insert tournaments" on public.tournament
  for insert to authenticated
  with check (public.is_admin());

create policy "Admins can update tournaments" on public.tournament
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete tournaments" on public.tournament
  for delete to authenticated
  using (public.is_admin());


-- Drop insecure policies on public.expression_of_interest
drop policy if exists "Enable insert for authenticated users only" on public.expression_of_interest;
drop policy if exists "Enable read access for all users" on public.expression_of_interest;

-- Create secure owner-only policies on public.expression_of_interest
create policy "Users can select their own expressions of interest" on public.expression_of_interest
  for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert their own expressions of interest" on public.expression_of_interest
  for insert to authenticated
  with check (auth.uid() = user_id);


-- Drop insecure update policy on public.bracket_match
drop policy if exists "Allow public update bracket match votes" on public.bracket_match;

-- Create secure admin-only update policy on public.bracket_match
create policy "Admins can update bracket matches" on public.bracket_match
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
