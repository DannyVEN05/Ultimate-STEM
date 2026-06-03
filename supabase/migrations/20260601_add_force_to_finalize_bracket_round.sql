create or replace function public.finalize_bracket_round(p_tournament_id bigint, p_round bigint, p_force boolean default false)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tournament record;
  v_bracket_id bigint;
  v_next_bracket_id bigint;
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
  v_finalize_job_name text := 'finalize_bracket_round_' || p_tournament_id || '_r' || p_round;
begin
  select *
  into v_tournament
  from public.tournament
  where tournament_id = p_tournament_id;

  if not found or v_tournament.tournament_status in ('terminated', 'concluded') then
    return;
  end if;

  if exists (select 1 from cron.job where jobname = v_finalize_job_name) then
    perform cron.unschedule(v_finalize_job_name);
  end if;

  select b.bracket_id
  into v_bracket_id
  from public.bracket b
  where b.tournament_id = p_tournament_id
    and b.bracket_round_number = p_round
  order by b.bracket_id desc
  limit 1;

  if v_bracket_id is null then
    return;
  end if;

  select count(*)
  into v_round1_matches
  from public.bracket_match bm
  join public.bracket b on b.bracket_id = bm.bracket_id
  where b.tournament_id = p_tournament_id
    and b.bracket_round_number = 1;

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

  update public.bracket
  set bracket_status = 'completed',
      tournamentsub_id = case when array_length(v_winners, 1) = 1 then v_winners[1] else null end,
      bracket_updated_at = now()
  where bracket_id = v_bracket_id;

  if array_length(v_winners, 1) = 1 then
    update public.tournament
    set tournament_status = 'concluded',
        tournament_updated_at = now()
    where tournament_id = p_tournament_id
      and tournament_status <> 'terminated';
    return;
  end if;

  select b.bracket_id
  into v_next_bracket_id
  from public.bracket b
  where b.tournament_id = p_tournament_id
    and b.bracket_round_number = p_round + 1
  order by b.bracket_id desc
  limit 1;

  if v_next_bracket_id is null then
    insert into public.bracket (
      tournament_id,
      bracket_round_number,
      bracket_status
    )
    values (
      p_tournament_id,
      p_round + 1,
      'active'
    )
    returning bracket_id into v_next_bracket_id;
  else
    update public.bracket
    set bracket_status = 'active',
        bracket_updated_at = now()
    where bracket_id = v_next_bracket_id;
  end if;

  if not exists (
    select 1
    from public.bracket_match
    where bracket_id = v_next_bracket_id
  ) then
    v_next_slot := 1;

    for v_next_slot in 1..(array_length(v_winners, 1) / 2) loop
      insert into public.bracket_match (
        bracket_id,
        bmatch_submission_a,
        bmatch_submission_b,
        bmatch_status,
        bmatch_index
      )
      values (
        v_next_bracket_id,
        v_winners[(v_next_slot * 2) - 1],
        v_winners[v_next_slot * 2],
        'running',
        jsonb_build_object('round', p_round + 1, 'slot', v_next_slot)
      );
    end loop;
  end if;
end;
$$;
