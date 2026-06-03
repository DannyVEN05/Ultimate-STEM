export interface TournamentSubmission {
  tournamentsub_id: string;
  tournamentsub_created_at: Date | null;
  tournamentsub_updated_at: Date | null;
  tournamentsub_likes: number;
  tournamentsub_status: string;
  tournament_id: string;
  concept_id: string;
}