export class TournamentSubmission {
  id: string;
  created_at: Date | null;
  updated_at: Date | null;
  likes: number;
  status: string;
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
    this.id = id;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.likes = likes;
    this.status = status;
    this.tournament_id = tournament_id;
    this.concept_id = concept_id;
  }
}