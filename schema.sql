


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."advance_bracket_round"("p_tournament_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."advance_bracket_round"("p_tournament_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."advance_tournament_lifecycle"("p_tournament_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."advance_tournament_lifecycle"("p_tournament_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_tournamentsub_likes"("id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
  begin
    update tournament_submission
    set tournamentsub_likes = greatest(0, tournamentsub_likes - 1)
    where tournamentsub_id = id;
  end
$$;


ALTER FUNCTION "public"."decrement_tournamentsub_likes"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."email_disabled"("email_to_check" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user 
    WHERE user_email = email_to_check
    AND user_role = 'deleted'
  );
END;
$$;


ALTER FUNCTION "public"."email_disabled"("email_to_check" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."email_exists"("email_to_check" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  RETURN EXISTS (SELECT 1 FROM public.user WHERE user_email = email_to_check);
END;$$;


ALTER FUNCTION "public"."email_exists"("email_to_check" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finalize_bracket_round"("p_tournament_id" bigint, "p_round" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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

  if now() < v_round_end then
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


ALTER FUNCTION "public"."finalize_bracket_round"("p_tournament_id" bigint, "p_round" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finalize_bracket_round"("p_tournament_id" bigint, "p_round" bigint, "p_force" boolean DEFAULT false) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."finalize_bracket_round"("p_tournament_id" bigint, "p_round" bigint, "p_force" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$begin
  insert into public.user (
    user_id,
    user_firstname,
    user_lastname,
    user_email
  )
  values (
    new.id,
    (new.raw_user_meta_data->>'user_firstname'),
    (new.raw_user_meta_data->>'user_lastname'),
    new.email
  );
  return new;
end;$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_tournamentsub_likes"("id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
  begin
    update tournament_submission
    set tournamentsub_likes = tournamentsub_likes + 1
    where tournamentsub_id = id;
  end
$$;


ALTER FUNCTION "public"."increment_tournamentsub_likes"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (SELECT user_role = 'admin' FROM "public"."user" WHERE user_id = auth.uid()),
    false
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."likes_count"("id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$BEGIN
  RETURN (
    SELECT COUNT(*) 
    from submission_likes 
    where tournamensub_id = id
  );
END;$$;


ALTER FUNCTION "public"."likes_count"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_tournament_started_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  perform public.advance_tournament_lifecycle(new.tournament_id);
  return new;
end;
$$;


ALTER FUNCTION "public"."on_tournament_started_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_tournament_status_changed_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if tg_op = 'INSERT' then
    if new.tournament_status in ('concluded', 'terminated') then
      new.tournament_end_date := now();
    end if;
  elsif tg_op = 'UPDATE' then
    if new.tournament_status in ('concluded', 'terminated') and old.tournament_status not in ('concluded', 'terminated') then
      new.tournament_end_date := now();
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."on_tournament_status_changed_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_stage2_brackets"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare
  t record;
begin
  -- 1. Initialise stage 2 brackets
  for t in
    select tournament_id
    from public.tournament
    where tournament_status = 'stage_2'
      and now() >= tournament_s2_start_date
      and now() < tournament_end_date
      and not exists (
        select 1
        from public.bracket b
        where b.tournament_id = tournament.tournament_id
      )
  loop
    perform public.initialize_stage2_brackets(t.tournament_id);
  end loop;

  -- 2. Advance active brackets when their calculated time ends
  for t in
    with tournament_rounds as (
      select
        tr.tournament_id,
        tr.tournament_s2_start_date,
        tr.tournament_end_date,
        b.bracket_id,
        b.bracket_round_number,
        floor(
          log(
            2,
            least(
              32,
              count(ts.tournamentsub_id)
            )::numeric
          )
        )::int as total_rounds
      from public.tournament tr
      join public.bracket b
        on b.tournament_id = tr.tournament_id
      join public.tournament_submission ts
        on ts.tournament_id = tr.tournament_id
       and ts.tournamentsub_status = 'approved'
      where tr.tournament_status = 'stage_2'
        and b.bracket_status = 'active'
        and now() < tr.tournament_end_date
      group by
        tr.tournament_id,
        tr.tournament_s2_start_date,
        tr.tournament_end_date,
        b.bracket_id,
        b.bracket_round_number
      having count(ts.tournamentsub_id) >= 2
    )
    select tournament_id
    from tournament_rounds
    where now() >= tournament_s2_start_date
      + (
          (tournament_end_date - tournament_s2_start_date)
          / total_rounds
          * bracket_round_number
        )
  loop
    perform public.advance_stage2_brackets(t.tournament_id);
  end loop;
end;
$$;


ALTER FUNCTION "public"."process_stage2_brackets"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reschedule_tournament_jobs"("p_tournament_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  -- Since pg_cron is not available, we run lifecycle checks immediately
  perform public.advance_tournament_lifecycle(p_tournament_id);
end;
$$;


ALTER FUNCTION "public"."reschedule_tournament_jobs"("p_tournament_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_tournament_cron"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."run_tournament_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_tournament_brackets"("p_tournament_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
      random()
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


ALTER FUNCTION "public"."seed_tournament_brackets"("p_tournament_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_auth_user_email_to_public_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only update when the email actually changed
  IF TG_OP = 'UPDATE' AND (NEW.email IS DISTINCT FROM OLD.email) THEN
    -- Update the public.user row that corresponds to the auth user id
    UPDATE public."user"
    SET user_email = NEW.email
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_auth_user_email_to_public_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."terminate_tournament"("p_tournament_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."terminate_tournament"("p_tournament_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_fn"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  raise notice 'hello';
end;
$$;


ALTER FUNCTION "public"."test_fn"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bracket" (
    "bracket_id" bigint NOT NULL,
    "bracket_created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bracket_updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tournament_id" bigint NOT NULL,
    "bracket_round_number" bigint NOT NULL,
    "bracket_status" character varying DEFAULT 'active'::character varying NOT NULL,
    "tournamentsub_id" "uuid"
);


ALTER TABLE "public"."bracket" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bracket"."tournamentsub_id" IS 'Bracket winner id';



CREATE TABLE IF NOT EXISTS "public"."bracket_match" (
    "bmatch_id" bigint NOT NULL,
    "bmatch_created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bmatch_updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bracket_id" bigint NOT NULL,
    "bmatch_submission_a" "uuid" NOT NULL,
    "bmatch_submission_b" "uuid" NOT NULL,
    "bmatch_status" character varying DEFAULT 'running'::character varying NOT NULL,
    "bmatch_index" "jsonb" NOT NULL
);


ALTER TABLE "public"."bracket_match" OWNER TO "postgres";


ALTER TABLE "public"."bracket_match" ALTER COLUMN "bmatch_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."bracket_matches_bracket_matches_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."bracket" ALTER COLUMN "bracket_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."brackets_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."concept" (
    "concept_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "concept_created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "concept_updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "concept_reviewed_at" timestamp with time zone,
    "concept_title" "text" NOT NULL,
    "concept_description" "text" NOT NULL,
    "concept_status" character varying DEFAULT 'active'::character varying NOT NULL,
    "user_id" "uuid" NOT NULL,
    "concept_styling" json NOT NULL,
    "concept_genre" "text" NOT NULL
);


ALTER TABLE "public"."concept" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expression_of_interest" (
    "eot_id" bigint NOT NULL,
    "eot_created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "eot_updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tournament_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "eot_status" "text" NOT NULL
);


ALTER TABLE "public"."expression_of_interest" OWNER TO "postgres";


ALTER TABLE "public"."expression_of_interest" ALTER COLUMN "eot_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."expression_of_interest_eot_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."submission_likes" (
    "user_id" "uuid" NOT NULL,
    "tournamentsub_id" "uuid" NOT NULL
);


ALTER TABLE "public"."submission_likes" OWNER TO "postgres";


COMMENT ON TABLE "public"."submission_likes" IS 'Stores a specified tournament submission id related to a specific user id';



CREATE TABLE IF NOT EXISTS "public"."tournament" (
    "tournament_id" bigint NOT NULL,
    "tournament_created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tournament_updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tournament_title" "text" NOT NULL,
    "tournament_genre" "text" NOT NULL,
    "tournament_user_limit" bigint NOT NULL,
    "tournament_end_date" timestamp with time zone NOT NULL,
    "tournament_start_date" timestamp with time zone NOT NULL,
    "tournament_status" character varying NOT NULL,
    "tournament_participants" bigint NOT NULL,
    "tournament_s2_start_date" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."tournament" OWNER TO "postgres";


ALTER TABLE "public"."tournament" ALTER COLUMN "tournament_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tournament_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tournament_submission" (
    "tournamentsub_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournamentsub_created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tournamentsub_updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tournament_id" bigint NOT NULL,
    "concept_id" "uuid" NOT NULL,
    "tournamentsub_status" character varying DEFAULT 'active'::character varying NOT NULL,
    "tournamentsub_likes" bigint DEFAULT '0'::bigint NOT NULL
);


ALTER TABLE "public"."tournament_submission" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user" (
    "user_id" "uuid" NOT NULL,
    "user_firstname" "text",
    "user_lastname" "text",
    "user_email" "text" NOT NULL,
    "user_created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_role" "text" DEFAULT 'user'::"text" NOT NULL
);


ALTER TABLE "public"."user" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vote" (
    "vote_created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "vote_updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bmatch_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tournamentsub_id" "uuid" NOT NULL
);


ALTER TABLE "public"."vote" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bracket_match"
    ADD CONSTRAINT "bracket_match_pkey" PRIMARY KEY ("bmatch_id");



ALTER TABLE ONLY "public"."bracket_match"
    ADD CONSTRAINT "bracket_matches_bracket_matches_id_key" UNIQUE ("bmatch_id");



ALTER TABLE ONLY "public"."bracket"
    ADD CONSTRAINT "bracket_pkey" PRIMARY KEY ("bracket_id");



ALTER TABLE ONLY "public"."bracket"
    ADD CONSTRAINT "brackets_brackets_id_key" UNIQUE ("bracket_id");



ALTER TABLE ONLY "public"."concept"
    ADD CONSTRAINT "concept_pkey" PRIMARY KEY ("concept_id");



ALTER TABLE ONLY "public"."expression_of_interest"
    ADD CONSTRAINT "expression_of_interest_pkey" PRIMARY KEY ("eot_id");



ALTER TABLE ONLY "public"."submission_likes"
    ADD CONSTRAINT "submission_likes_pkey" PRIMARY KEY ("user_id", "tournamentsub_id");



ALTER TABLE ONLY "public"."tournament"
    ADD CONSTRAINT "tournament_id_key" UNIQUE ("tournament_id");



ALTER TABLE ONLY "public"."tournament"
    ADD CONSTRAINT "tournament_pkey" PRIMARY KEY ("tournament_id");



ALTER TABLE ONLY "public"."tournament_submission"
    ADD CONSTRAINT "tournament_submission_pkey" PRIMARY KEY ("tournamentsub_id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."vote"
    ADD CONSTRAINT "vote_pkey" PRIMARY KEY ("bmatch_id", "user_id");



CREATE OR REPLACE TRIGGER "trigger_tournament_started" AFTER INSERT OR UPDATE ON "public"."tournament" FOR EACH ROW EXECUTE FUNCTION "public"."on_tournament_started_trigger"();



CREATE OR REPLACE TRIGGER "trigger_tournament_status_changed" BEFORE INSERT OR UPDATE ON "public"."tournament" FOR EACH ROW EXECUTE FUNCTION "public"."on_tournament_status_changed_trigger"();



ALTER TABLE ONLY "public"."bracket_match"
    ADD CONSTRAINT "bracket_match_bmatch_submission_a_fkey" FOREIGN KEY ("bmatch_submission_a") REFERENCES "public"."tournament_submission"("tournamentsub_id");



ALTER TABLE ONLY "public"."bracket_match"
    ADD CONSTRAINT "bracket_match_bmatch_submission_b_fkey" FOREIGN KEY ("bmatch_submission_b") REFERENCES "public"."tournament_submission"("tournamentsub_id");



ALTER TABLE ONLY "public"."bracket_match"
    ADD CONSTRAINT "bracket_match_bracket_id_fkey" FOREIGN KEY ("bracket_id") REFERENCES "public"."bracket"("bracket_id");



ALTER TABLE ONLY "public"."bracket"
    ADD CONSTRAINT "bracket_tournamentsub_id_fkey" FOREIGN KEY ("tournamentsub_id") REFERENCES "public"."tournament_submission"("tournamentsub_id");



ALTER TABLE ONLY "public"."bracket"
    ADD CONSTRAINT "brackets_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("tournament_id");



ALTER TABLE ONLY "public"."concept"
    ADD CONSTRAINT "concept_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id");



ALTER TABLE ONLY "public"."expression_of_interest"
    ADD CONSTRAINT "expression_of_interest_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("tournament_id");



ALTER TABLE ONLY "public"."expression_of_interest"
    ADD CONSTRAINT "expression_of_interest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id");



ALTER TABLE ONLY "public"."submission_likes"
    ADD CONSTRAINT "submission_likes_tournamentsub_id_fkey" FOREIGN KEY ("tournamentsub_id") REFERENCES "public"."tournament_submission"("tournamentsub_id");



ALTER TABLE ONLY "public"."submission_likes"
    ADD CONSTRAINT "submission_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id");



ALTER TABLE ONLY "public"."tournament_submission"
    ADD CONSTRAINT "tournament_submissions_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "public"."concept"("concept_id");



ALTER TABLE ONLY "public"."tournament_submission"
    ADD CONSTRAINT "tournament_submissions_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("tournament_id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vote"
    ADD CONSTRAINT "vote_tournamentsub_id_fkey" FOREIGN KEY ("tournamentsub_id") REFERENCES "public"."tournament_submission"("tournamentsub_id");



ALTER TABLE ONLY "public"."vote"
    ADD CONSTRAINT "vote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id");



ALTER TABLE ONLY "public"."vote"
    ADD CONSTRAINT "votes_bmatch_id_fkey" FOREIGN KEY ("bmatch_id") REFERENCES "public"."bracket_match"("bmatch_id");



CREATE POLICY "Admins can delete tournaments" ON "public"."tournament" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can fetch any user" ON "public"."user" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can insert any submission" ON "public"."tournament_submission" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user"
  WHERE (("user"."user_id" = "auth"."uid"()) AND ("user"."user_role" = 'admin'::"text")))));



CREATE POLICY "Admins can insert tournaments" ON "public"."tournament" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can update all concepts" ON "public"."concept" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user"
  WHERE (("user"."user_id" = "auth"."uid"()) AND ("user"."user_role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user"
  WHERE (("user"."user_id" = "auth"."uid"()) AND ("user"."user_role" = 'admin'::"text")))));



CREATE POLICY "Admins can update all tournament submissions" ON "public"."tournament_submission" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user"
  WHERE (("user"."user_id" = "auth"."uid"()) AND ("user"."user_role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user"
  WHERE (("user"."user_id" = "auth"."uid"()) AND ("user"."user_role" = 'admin'::"text")))));



CREATE POLICY "Admins can update bracket matches" ON "public"."bracket_match" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can update tournaments" ON "public"."tournament" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Anyone can select all concepts" ON "public"."concept" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can select all tournament submissions" ON "public"."tournament_submission" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable delete for users based on user_id" ON "public"."expression_of_interest" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."vote" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable read access for all users" ON "public"."tournament" FOR SELECT USING (true);



CREATE POLICY "Enable select for authenticated users" ON "public"."submission_likes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "SELECT" ON "public"."bracket" FOR SELECT USING (true);



CREATE POLICY "SELECT" ON "public"."bracket_match" FOR SELECT USING (true);



CREATE POLICY "Users can delete their like for a specific tournament submissio" ON "public"."submission_likes" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own votes" ON "public"."vote" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert submissions for their own concepts" ON "public"."tournament_submission" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."concept"
  WHERE (("concept"."concept_id" = "tournament_submission"."concept_id") AND ("concept"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own expressions of interest" ON "public"."expression_of_interest" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert to like a tournament submission" ON "public"."submission_likes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select their own expressions of interest" ON "public"."expression_of_interest" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



CREATE POLICY "Users can select votes" ON "public"."vote" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can submit concepts" ON "public"."concept" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."user" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own concepts" ON "public"."concept" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own tournament submissions" ON "public"."tournament_submission" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."concept"
  WHERE (("concept"."concept_id" = "tournament_submission"."concept_id") AND ("concept"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."concept"
  WHERE (("concept"."concept_id" = "tournament_submission"."concept_id") AND ("concept"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update votes" ON "public"."vote" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."user" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."bracket" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bracket_match" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bracket_match_read" ON "public"."bracket_match" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "bracket_match_service_all" ON "public"."bracket_match" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "bracket_read" ON "public"."bracket" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "bracket_service_all" ON "public"."bracket" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."concept" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expression_of_interest" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."submission_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournament" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournament_submission" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vote" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."bracket";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."concept";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."tournament_submission";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."advance_bracket_round"("p_tournament_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."advance_bracket_round"("p_tournament_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."advance_bracket_round"("p_tournament_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."advance_tournament_lifecycle"("p_tournament_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."advance_tournament_lifecycle"("p_tournament_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."advance_tournament_lifecycle"("p_tournament_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_tournamentsub_likes"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_tournamentsub_likes"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_tournamentsub_likes"("id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."email_disabled"("email_to_check" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."email_disabled"("email_to_check" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."email_disabled"("email_to_check" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."email_exists"("email_to_check" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."email_exists"("email_to_check" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."email_exists"("email_to_check" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."finalize_bracket_round"("p_tournament_id" bigint, "p_round" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."finalize_bracket_round"("p_tournament_id" bigint, "p_round" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."finalize_bracket_round"("p_tournament_id" bigint, "p_round" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."finalize_bracket_round"("p_tournament_id" bigint, "p_round" bigint, "p_force" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."finalize_bracket_round"("p_tournament_id" bigint, "p_round" bigint, "p_force" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."finalize_bracket_round"("p_tournament_id" bigint, "p_round" bigint, "p_force" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_tournamentsub_likes"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_tournamentsub_likes"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_tournamentsub_likes"("id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."likes_count"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."likes_count"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."likes_count"("id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."on_tournament_started_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_tournament_started_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_tournament_started_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."on_tournament_status_changed_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_tournament_status_changed_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_tournament_status_changed_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_stage2_brackets"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_stage2_brackets"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_stage2_brackets"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reschedule_tournament_jobs"("p_tournament_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."reschedule_tournament_jobs"("p_tournament_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reschedule_tournament_jobs"("p_tournament_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."run_tournament_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_tournament_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_tournament_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_tournament_brackets"("p_tournament_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."seed_tournament_brackets"("p_tournament_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_tournament_brackets"("p_tournament_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_auth_user_email_to_public_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_auth_user_email_to_public_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_auth_user_email_to_public_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."terminate_tournament"("p_tournament_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."terminate_tournament"("p_tournament_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."terminate_tournament"("p_tournament_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."test_fn"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_fn"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_fn"() TO "service_role";
























GRANT ALL ON TABLE "public"."bracket" TO "anon";
GRANT ALL ON TABLE "public"."bracket" TO "authenticated";
GRANT ALL ON TABLE "public"."bracket" TO "service_role";



GRANT ALL ON TABLE "public"."bracket_match" TO "anon";
GRANT ALL ON TABLE "public"."bracket_match" TO "authenticated";
GRANT ALL ON TABLE "public"."bracket_match" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bracket_matches_bracket_matches_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bracket_matches_bracket_matches_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bracket_matches_bracket_matches_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."brackets_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."brackets_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."brackets_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."concept" TO "anon";
GRANT ALL ON TABLE "public"."concept" TO "authenticated";
GRANT ALL ON TABLE "public"."concept" TO "service_role";



GRANT ALL ON TABLE "public"."expression_of_interest" TO "anon";
GRANT ALL ON TABLE "public"."expression_of_interest" TO "authenticated";
GRANT ALL ON TABLE "public"."expression_of_interest" TO "service_role";



GRANT ALL ON SEQUENCE "public"."expression_of_interest_eot_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."expression_of_interest_eot_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."expression_of_interest_eot_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."submission_likes" TO "anon";
GRANT ALL ON TABLE "public"."submission_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."submission_likes" TO "service_role";



GRANT ALL ON TABLE "public"."tournament" TO "anon";
GRANT ALL ON TABLE "public"."tournament" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tournament_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tournament_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tournament_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_submission" TO "anon";
GRANT ALL ON TABLE "public"."tournament_submission" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_submission" TO "service_role";



GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";



GRANT ALL ON TABLE "public"."vote" TO "anon";
GRANT ALL ON TABLE "public"."vote" TO "authenticated";
GRANT ALL ON TABLE "public"."vote" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































