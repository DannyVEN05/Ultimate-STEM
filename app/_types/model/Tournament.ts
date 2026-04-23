export type TournamentStatus = "upcoming" | "stage1" | "stage2" | "concluded" | "terminated";

export class Tournament {
  tournament_id: string;
  tournament_title: string;
  tournament_genre: string;
  tournament_start_date: string;
  tournament_s2_start_date: string | null;
  tournament_end_date: string;
  tournament_participants: number;
  tournament_user_limit: number;
  tournament_status: TournamentStatus;

  constructor(
    id: string = '',
    title: string = '',
    genre: string = '',
    start_date: string = '',
    s2_start_date: string | null = null,
    end_date: string = '',
    participants: number = 0,
    user_limit: number = 0,
    status: TournamentStatus = 'upcoming'
  ) {
    this.tournament_id = id;
    this.tournament_title = title;
    this.tournament_genre = genre;
    this.tournament_start_date = start_date;
    this.tournament_s2_start_date = s2_start_date;
    this.tournament_end_date = end_date;
    this.tournament_participants = participants;
    this.tournament_user_limit = user_limit;
    this.tournament_status = status;
  }
}
