export type BracketMatchStatus = "running" | "finished";

export interface BracketMatch {
  bmatch_id: number;
  bmatch_created_at: Date | null;
  bmatch_updated_at: Date | null;
  bracket_id: number;
  bmatch_concept_a: string;        // tournamentsub_id UUID
  bmatch_concept_b: string | null; // null for bye matches
  bmatch_concept_a_votes: number;
  bmatch_concept_b_votes: number;
  bmatch_status: BracketMatchStatus;
}
