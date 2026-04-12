export class TournamentSubmission {
  tournamentsub_id: string;
  tournamentsub_created_at: Date | null;
  tournamentsub_updated_at: Date | null;
  tournamentsub_likes: number;
  tournamentsub_status: string;
  tournament_id: string;
  concept_id: string;

  constructor(
    id: string = '',
    created_at: Date | null = null,
    updated_at: Date | null = null,
    likes: number = 0,
    status: string = '',
    tournament_id: string = '',
    concept_id: string = ''
  ) {
    this.tournamentsub_id = id;
    this.tournamentsub_created_at = created_at;
    this.tournamentsub_updated_at = updated_at;
    this.tournamentsub_likes = likes;
    this.tournamentsub_status = status;
    this.tournament_id = tournament_id;
    this.concept_id = concept_id;
  }
}