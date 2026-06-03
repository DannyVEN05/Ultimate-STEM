-- Drop pg_cron functions if they exist (clean up database)
drop function if exists public.schedule_stage1_start(bigint);
drop function if exists public.schedule_stage1_end_seeding(bigint);
drop function if exists public.schedule_bracket_round_jobs(bigint);
drop function if exists public.initialize_stage2_brackets(bigint);
drop function if exists public.advance_stage2_brackets(bigint);
drop function if exists public.advance_tournament_to_stage1(bigint);

-- Create or replace lifecycle advancement functions
create or replace function public.advance_tournament_lifecycle(p_tournament_id bigint)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tournament record;
begin
  select *
  into v_tournament
  from public.tournament
  where tournament_id = p_tournament_id;

  if not found or v_tournament.tournament_status in ('terminated', 'concluded') then
    return;
  end if;

  -- 1. Advancing from upcoming to stage1
  if v_tournament.tournament_status = 'upcoming' and now() >= v_tournament.tournament_start_date then
    update public.tournament
    set tournament_status = 'stage1',
        tournament_updated_at = now()
    where tournament_id = p_tournament_id;
    
    v_tournament.tournament_status := 'stage1';
  end if;

  -- 2. Advancing from stage1 to stage2 (seeding)
  if v_tournament.tournament_status = 'stage1' and now() >= v_tournament.tournament_s2_start_date then
    perform public.seed_tournament_brackets(p_tournament_id);
    
    select tournament_status into v_tournament.tournament_status
    from public.tournament
    where tournament_id = p_tournament_id;
  end if;

  -- 3. Advancing bracket rounds in stage2
  if v_tournament.tournament_status = 'stage2' then
    -- Check if it is in limbo (stage2 but no brackets exist)
    if not exists (
      select 1
      from public.bracket b
      where b.tournament_id = p_tournament_id
    ) then
      update public.tournament
      set tournament_status = 'concluded',
          tournament_updated_at = now()
      where tournament_id = p_tournament_id;
      
      v_tournament.tournament_status := 'concluded';
    else
      perform public.advance_bracket_round(p_tournament_id);
    end if;
  end if;
end;
$$;


create or replace function public.seed_tournament_brackets(p_tournament_id bigint)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tournament record;
  v_approved_count int;
  v_seed_count int;
  v_ranked_subs uuid[];
  v_bracket_id bigint;
  v_round1_match_count int;
  v_idx int;
  v_slot int;
  v_sub_a uuid;
  v_sub_b uuid;
begin
  select *
  into v_tournament
  from public.tournament
  where tournament_id = p_tournament_id;

  if not found or v_tournament.tournament_status in ('terminated', 'concluded') then
    return;
  end if;

  -- Count approved submissions
  select count(*)
  into v_approved_count
  from public.tournament_submission
  where tournament_id = p_tournament_id
    and tournamentsub_status = 'approved';

  if v_approved_count is null or v_approved_count = 0 then
    update public.tournament
    set tournament_status = 'concluded',
        tournament_updated_at = now()
    where tournament_id = p_tournament_id;
    return;
  end if;

  -- Ensure we have a single bracket row for this tournament
  select b.bracket_id
  into v_bracket_id
  from public.bracket b
  where b.tournament_id = p_tournament_id
  order by b.bracket_id desc
  limit 1;

  if v_bracket_id is null then
    insert into public.bracket (tournament_id, bracket_round_number, bracket_status)
    values (p_tournament_id, 1, 'active')
    returning bracket_id into v_bracket_id;
  else
    update public.bracket
    set bracket_round_number = 1,
        bracket_status = 'active',
        tournamentsub_id = null,
        bracket_updated_at = now()
    where bracket_id = v_bracket_id;
  end if;

  -- Special case: 1 approved submission
  if v_approved_count = 1 then
    select ts.tournamentsub_id
    into v_sub_a
    from public.tournament_submission ts
    where ts.tournament_id = p_tournament_id
      and ts.tournamentsub_status = 'approved'
    limit 1;

    update public.bracket
    set bracket_status = 'completed',
        tournamentsub_id = v_sub_a,
        bracket_round_number = 1,
        bracket_updated_at = now()
    where bracket_id = v_bracket_id;

    update public.tournament
    set tournament_status = 'concluded',
        tournament_updated_at = now()
    where tournament_id = p_tournament_id;

    return;
  end if;

  -- Seeding size logic:
  -- - For 2-4 submissions, seed 2.
  -- - For 5+ submissions, greatest power of 2 <= 50% of approved count, capped at 32.
  v_seed_count := floor(v_approved_count / 2.0)::int;
  v_seed_count := greatest(2, least(32, v_seed_count));
  v_seed_count := power(2::numeric, floor(log(2::numeric, v_seed_count::numeric)))::int;

  select array(
    select ts.tournamentsub_id
    from public.tournament_submission ts
    where ts.tournament_id = p_tournament_id
      and ts.tournamentsub_status = 'approved'
    order by
      ts.tournamentsub_likes desc,
      ts.tournamentsub_updated_at asc,
      ts.tournamentsub_created_at asc,
      ts.tournamentsub_id asc
    limit v_seed_count
  )
  into v_ranked_subs;

  if v_ranked_subs is null or array_length(v_ranked_subs, 1) is null or array_length(v_ranked_subs, 1) < 2 then
    return;
  end if;

  v_seed_count := array_length(v_ranked_subs, 1);

  -- Only insert Round 1 matches if they don't already exist for this bracket
  select count(*)
  into v_round1_match_count
  from public.bracket_match
  where bracket_id = v_bracket_id
    and (bmatch_index ->> 'round')::int = 1;

  if v_round1_match_count = 0 then
    for v_idx in 0..((v_seed_count / 2) - 1) loop
      v_sub_a := v_ranked_subs[v_idx * 2 + 1];
      v_sub_b := v_ranked_subs[v_idx * 2 + 2];
      v_slot := v_idx + 1;

      insert into public.bracket_match (
        bracket_id,
        bmatch_submission_a,
        bmatch_submission_b,
        bmatch_status,
        bmatch_index
      )
      values (
        v_bracket_id,
        v_sub_a,
        v_sub_b,
        'running',
        jsonb_build_object('round', 1, 'slot', v_slot)
      );
    end loop;
  end if;

  update public.tournament
  set tournament_status = 'stage2',
      tournament_updated_at = now()
  where tournament_id = p_tournament_id
    and tournament_status not in ('terminated', 'concluded', 'stage2');
end;
$$;


create or replace function public.finalize_bracket_round(p_tournament_id bigint, p_round bigint, p_force boolean default false)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tournament record;
  v_bracket_id bigint;
  v_match record;
  v_a_count int;
  v_b_count int;
  v_a_reached timestamptz;
  v_b_reached timestamptz;
  v_winner_sub_id uuid;
  v_winners uuid[] := array[]::uuid[];
  v_round1_matches int;
  v_total_rounds int;
  v_round_duration interval;
  v_round_end timestamptz;
  v_next_slot int;
begin
  select *
  into v_tournament
  from public.tournament
  where tournament_id = p_tournament_id;

  if not found or v_tournament.tournament_status in ('terminated', 'concluded') then
    return;
  end if;

  select b.bracket_id
  into v_bracket_id
  from public.bracket b
  where b.tournament_id = p_tournament_id
  order by b.bracket_id desc
  limit 1;

  if v_bracket_id is null then
    return;
  end if;

  select count(*)
  into v_round1_matches
  from public.bracket_match bm
  where bm.bracket_id = v_bracket_id
    and (bm.bmatch_index ->> 'round')::int = 1;

  if v_round1_matches is null or v_round1_matches = 0 then
    return;
  end if;

  v_total_rounds := greatest(1, ceil(log(2::numeric, (v_round1_matches * 2)::numeric))::int);
  v_round_duration := (v_tournament.tournament_end_date - v_tournament.tournament_s2_start_date) / v_total_rounds;
  v_round_end := v_tournament.tournament_s2_start_date + (v_round_duration * p_round);

  if not p_force and now() < v_round_end then
    return;
  end if;

  for v_match in
    select bm.*
    from public.bracket_match bm
    where bm.bracket_id = v_bracket_id
      and (bm.bmatch_index ->> 'round')::int = p_round
    order by coalesce((bm.bmatch_index ->> 'slot')::int, 0), bm.bmatch_id
  loop
    with vote_events as (
      select
        v.tournamentsub_id,
        coalesce(v.vote_updated_at, v.vote_created_at) as vote_ts,
        row_number() over (
          partition by v.tournamentsub_id
          order by coalesce(v.vote_updated_at, v.vote_created_at), v.user_id
        ) as rn,
        count(*) over (partition by v.tournamentsub_id) as total_votes
      from public.vote v
      where v.bmatch_id = v_match.bmatch_id
        and v.tournamentsub_id in (v_match.bmatch_submission_a, v_match.bmatch_submission_b)
    ),
    vote_summary as (
      select
        tournamentsub_id,
        count(*)::int as vote_count,
        max(vote_ts) filter (where rn = total_votes) as reached_at
      from vote_events
      group by tournamentsub_id
    )
    select
      coalesce(max(case when tournamentsub_id = v_match.bmatch_submission_a then vote_count end), 0),
      max(case when tournamentsub_id = v_match.bmatch_submission_a then reached_at end),
      coalesce(max(case when tournamentsub_id = v_match.bmatch_submission_b then vote_count end), 0),
      max(case when tournamentsub_id = v_match.bmatch_submission_b then reached_at end)
    into v_a_count, v_a_reached, v_b_count, v_b_reached
    from vote_summary;

    if coalesce(v_a_count, 0) > coalesce(v_b_count, 0) then
      v_winner_sub_id := v_match.bmatch_submission_a;
    elsif coalesce(v_b_count, 0) > coalesce(v_a_count, 0) then
      v_winner_sub_id := v_match.bmatch_submission_b;
    elsif coalesce(v_a_count, 0) = 0 and coalesce(v_b_count, 0) = 0 then
      v_winner_sub_id := v_match.bmatch_submission_a;
    elsif coalesce(v_a_reached, 'infinity'::timestamptz) < coalesce(v_b_reached, 'infinity'::timestamptz) then
      v_winner_sub_id := v_match.bmatch_submission_a;
    elsif coalesce(v_b_reached, 'infinity'::timestamptz) < coalesce(v_a_reached, 'infinity'::timestamptz) then
      v_winner_sub_id := v_match.bmatch_submission_b;
    else
      v_winner_sub_id := v_match.bmatch_submission_a;
    end if;

    v_winners := array_append(v_winners, v_winner_sub_id);

    update public.bracket_match
    set bmatch_status = 'completed',
        bmatch_updated_at = now()
    where bmatch_id = v_match.bmatch_id;
  end loop;

  if array_length(v_winners, 1) is null then
    return;
  end if;

  if array_length(v_winners, 1) = 1 then
    update public.bracket
    set bracket_status = 'completed',
        tournamentsub_id = v_winners[1],
        bracket_updated_at = now()
    where bracket_id = v_bracket_id;

    update public.tournament
    set tournament_status = 'concluded',
        tournament_updated_at = now()
    where tournament_id = p_tournament_id
      and tournament_status <> 'terminated';
    return;
  end if;

  update public.bracket
  set bracket_round_number = p_round + 1,
      bracket_updated_at = now()
  where bracket_id = v_bracket_id;

  if not exists (
    select 1
    from public.bracket_match
    where bracket_id = v_bracket_id
      and (bmatch_index ->> 'round')::int = p_round + 1
  ) then
    for v_next_slot in 1..(array_length(v_winners, 1) / 2) loop
      insert into public.bracket_match (
        bracket_id,
        bmatch_submission_a,
        bmatch_submission_b,
        bmatch_status,
        bmatch_index
      )
      values (
        v_bracket_id,
        v_winners[(v_next_slot * 2) - 1],
        v_winners[v_next_slot * 2],
        'running',
        jsonb_build_object('round', p_round + 1, 'slot', v_next_slot)
      );
    end loop;
  end if;
end;
$$;


create or replace function public.advance_bracket_round(p_tournament_id bigint)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tournament record;
  v_bracket_id bigint;
  v_active_round bigint;
  v_round1_matches int;
  v_total_rounds int;
  v_round_duration interval;
  v_round_end timestamptz;
begin
  select *
  into v_tournament
  from public.tournament
  where tournament_id = p_tournament_id;

  if not found or v_tournament.tournament_status in ('terminated', 'concluded') then
    return;
  end if;

  select b.bracket_id, b.bracket_round_number
  into v_bracket_id, v_active_round
  from public.bracket b
  where b.tournament_id = p_tournament_id
    and b.bracket_status = 'active'
  limit 1;

  if v_bracket_id is null or v_active_round is null then
    return;
  end if;

  loop
    select count(*)
    into v_round1_matches
    from public.bracket_match bm
    where bm.bracket_id = v_bracket_id
      and (bm.bmatch_index ->> 'round')::int = 1;

    if v_round1_matches is null or v_round1_matches = 0 then
      return;
    end if;

    v_total_rounds := greatest(1, ceil(log(2::numeric, (v_round1_matches * 2)::numeric))::int);
    v_round_duration := (v_tournament.tournament_end_date - v_tournament.tournament_s2_start_date) / v_total_rounds;
    v_round_end := v_tournament.tournament_s2_start_date + (v_round_duration * v_active_round);

    exit when now() < v_round_end;

    perform public.finalize_bracket_round(p_tournament_id, v_active_round);

    select b.bracket_round_number, b.bracket_status
    into v_active_round, v_tournament.tournament_status
    from public.bracket b
    where b.bracket_id = v_bracket_id;

    exit when v_tournament.tournament_status = 'completed';
  end loop;
end;
$$;


create or replace function public.run_tournament_cron()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tournament_id bigint;
begin
  for v_tournament_id in
    select t.tournament_id
    from public.tournament t
    where t.tournament_status in ('upcoming', 'stage1', 'stage2')
  loop
    perform public.advance_tournament_lifecycle(v_tournament_id);
  end loop;
end;
$$;


create or replace function public.reschedule_tournament_jobs(p_tournament_id bigint)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Since pg_cron is not available, we run lifecycle checks immediately
  perform public.advance_tournament_lifecycle(p_tournament_id);
end;
$$;


create or replace function public.terminate_tournament(p_tournament_id bigint)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.tournament
  set tournament_status = 'terminated',
      tournament_updated_at = now()
  where tournament_id = p_tournament_id;

  update public.tournament_submission
  set tournamentsub_status = 'terminated',
      tournamentsub_updated_at = now()
  where tournament_id = p_tournament_id;

  update public.bracket
  set bracket_status = 'completed',
      bracket_updated_at = now()
  where tournament_id = p_tournament_id
    and bracket_status = 'active';

  update public.bracket_match
  set bmatch_status = 'completed',
      bmatch_updated_at = now()
  where bracket_id in (
    select bracket_id
    from public.bracket
    where tournament_id = p_tournament_id
  )
    and bmatch_status <> 'completed';
end;
$$;


create or replace function public.on_tournament_started_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  perform public.advance_tournament_lifecycle(new.tournament_id);
  return new;
end;
$$;

-- Drop and recreate the trigger to run on both INSERT and UPDATE
drop trigger if exists trigger_tournament_started on public.tournament;

create trigger trigger_tournament_started
after insert or update on public.tournament
for each row
execute function public.on_tournament_started_trigger();
