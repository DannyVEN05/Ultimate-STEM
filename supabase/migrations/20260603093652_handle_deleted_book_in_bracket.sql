-- Replace finalize_bracket_round to handle deleted books.
-- If one side of a match has a deleted submission (or deleted concept), the
-- opposing side automatically advances regardless of vote counts.

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
  v_a_valid boolean;
  v_b_valid boolean;
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
    -- Check whether each submission side is still valid (not deleted, concept not deleted)
    select exists (
      select 1
      from public.tournament_submission ts
      join public.concept c on c.concept_id = ts.concept_id
      where ts.tournamentsub_id = v_match.bmatch_submission_a
        and ts.tournamentsub_status <> 'deleted'
        and ts.tournamentsub_status <> 'terminated'
        and c.concept_status <> 'deleted'
    ) into v_a_valid;

    select exists (
      select 1
      from public.tournament_submission ts
      join public.concept c on c.concept_id = ts.concept_id
      where ts.tournamentsub_id = v_match.bmatch_submission_b
        and ts.tournamentsub_status <> 'deleted'
        and ts.tournamentsub_status <> 'terminated'
        and c.concept_status <> 'deleted'
    ) into v_b_valid;

    -- Auto-advance if one or both sides are deleted
    if v_a_valid and not v_b_valid then
      -- B is deleted → A wins automatically
      v_winner_sub_id := v_match.bmatch_submission_a;
    elsif v_b_valid and not v_a_valid then
      -- A is deleted → B wins automatically
      v_winner_sub_id := v_match.bmatch_submission_b;
    elsif not v_a_valid and not v_b_valid then
      -- Both deleted — pick A arbitrarily (edge case)
      v_winner_sub_id := v_match.bmatch_submission_a;
    else
      -- Both valid — determine winner by votes (original logic)
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
      elsif coalesce(v_a_count, 0) > 0 then
        if coalesce(v_a_reached, 'infinity'::timestamptz) < coalesce(v_b_reached, 'infinity'::timestamptz) then
          v_winner_sub_id := v_match.bmatch_submission_a;
        elsif coalesce(v_b_reached, 'infinity'::timestamptz) < coalesce(v_a_reached, 'infinity'::timestamptz) then
          v_winner_sub_id := v_match.bmatch_submission_b;
        else
          if random() < 0.5 then
            v_winner_sub_id := v_match.bmatch_submission_a;
          else
            v_winner_sub_id := v_match.bmatch_submission_b;
          end if;
        end if;
      else
        if random() < 0.5 then
          v_winner_sub_id := v_match.bmatch_submission_a;
        else
          v_winner_sub_id := v_match.bmatch_submission_b;
        end if;
      end if;
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
