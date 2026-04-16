-- Atomically terminates a tournament and all its submissions in a single transaction.
CREATE OR REPLACE FUNCTION terminate_tournament(p_tournament_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tournament
  SET tournament_status     = 'terminated',
      tournament_updated_at = NOW()
  WHERE tournament_id = p_tournament_id;

  UPDATE tournament_submission
  SET tournamentsub_status     = 'terminated',
      tournamentsub_updated_at = NOW()
  WHERE tournament_id = p_tournament_id;
END;
$$;
