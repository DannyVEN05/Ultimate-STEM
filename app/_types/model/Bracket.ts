export type BracketStatus = "active" | "pending" | "concluded";

export interface Bracket {
  bracket_id: number;
  bracket_created_at: Date | null;
  bracket_updated_at: Date | null;
  tournament_id: number;
  bracket_round_number: number;
  bracket_status: BracketStatus;
  tournamentsub_id: string | null; // winner's tournamentsub_id, set when round concludes
}
