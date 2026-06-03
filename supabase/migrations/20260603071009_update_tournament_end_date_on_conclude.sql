create or replace function public.on_tournament_status_changed_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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

-- Drop trigger if exists
drop trigger if exists trigger_tournament_status_changed on public.tournament;

-- Create the trigger
create trigger trigger_tournament_status_changed
before insert or update on public.tournament
for each row
execute function public.on_tournament_status_changed_trigger();
