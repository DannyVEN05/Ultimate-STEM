export type TournamentLifecycleStatus =
  | "upcoming"
  | "stage1"
  | "stage2"
  | "concluded"
  | "terminated";

export type TournamentTiming = {
  tournament_status: string;
  tournament_start_date: string;
  tournament_s2_start_date: string | null;
  tournament_end_date: string;
};

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

type CountdownTarget = {
  label: string;
  targetMs: number | null;
};

function toMs(value: string | null | undefined): number | null {
  if (!value) return null;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

export function resolveTournamentLifecycleStatus(
  tournament: TournamentTiming | null | undefined,
  now = Date.now(),
): TournamentLifecycleStatus {
  if (!tournament) return "upcoming";

  return tournament.tournament_status as TournamentLifecycleStatus;
}

export function getCountdownParts(
  targetMs: number | null | undefined,
  now = Date.now(),
): CountdownParts {
  if (!targetMs) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  const totalMs = Math.max(0, targetMs - now);
  const totalSeconds = Math.floor(totalMs / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
  };
}

export function formatCountdownParts(
  parts: CountdownParts,
  showSeconds = false,
): string {
  const segments = [
    `${parts.days}d`,
    `${String(parts.hours).padStart(2, "0")}h`,
    `${String(parts.minutes).padStart(2, "0")}m`,
  ];

  if (showSeconds) {
    segments.push(`${String(parts.seconds).padStart(2, "0")}s`);
  }

  return segments.join(" ");
}

export function getTournamentMilestoneTarget(
  tournament: TournamentTiming | null | undefined,
  status: TournamentLifecycleStatus,
): CountdownTarget {
  const startMs = toMs(tournament?.tournament_start_date);
  const stage2Ms = toMs(tournament?.tournament_s2_start_date);
  const endMs = toMs(tournament?.tournament_end_date);

  if (status === "upcoming") {
    return { label: "Tournament starts in", targetMs: startMs };
  }

  if (status === "stage1") {
    return {
      label: "Stage 2 starts in",
      targetMs: stage2Ms ?? endMs,
    };
  }

  if (status === "stage2") {
    return { label: "Voting ends in", targetMs: endMs };
  }

  return { label: "Tournament finished", targetMs: null };
}

export function getRoundCountdownTarget(
  tournament: TournamentTiming | null | undefined,
  totalRounds: number,
  activeRound: number,
): number | null {
  const stage2Ms = toMs(tournament?.tournament_s2_start_date);
  const endMs = toMs(tournament?.tournament_end_date);

  if (
    stage2Ms === null || endMs === null || totalRounds <= 0 || activeRound <= 0
  ) {
    return null;
  }

  const roundDuration = (endMs - stage2Ms) / totalRounds;
  return stage2Ms + (roundDuration * activeRound);
}
