import { BookCover } from "./Concept";

export class Book {
  tournamentsub_id: string;
  tournamentsub_created_at: Date | null;
  tournamentsub_updated_at: Date | null;
  tournament_id: number;
  tournamentsub_status: string;
  tournamentsub_likes: number;
  concept_id: string;
  concept_created_at: Date | null;
  concept_updated_at: Date | null;
  concept_reviewed_at: Date | null;
  concept_title: string;
  concept_description: string;
  concept_status: string;
  concept_styling: BookCover;
  concept_genre: string;
  user_id: string;

  constructor(
    tournamentsub_id: string = '',
    tournamentsub_created_at: Date | null = null,
    tournamentsub_updated_at: Date | null = null,
    tournament_id: number = 0,
    tournamentsub_status: string = '',
    tournamentsub_likes: number = 0,
    concept_id: string = '',
    concept_created_at: Date | null = null,
    concept_updated_at: Date | null = null,
    concept_reviewed_at: Date | null = null,
    concept_title: string = '',
    concept_description: string = '',
    concept_status: string = '',
    concept_styling: BookCover = {},
    concept_genre: string = '',
    user_id: string = ''
  ) {
    this.tournamentsub_id = tournamentsub_id;
    this.tournamentsub_created_at = tournamentsub_created_at;
    this.tournamentsub_updated_at = tournamentsub_updated_at;
    this.tournament_id = tournament_id;
    this.tournamentsub_status = tournamentsub_status;
    this.tournamentsub_likes = tournamentsub_likes;
    this.concept_id = concept_id;
    this.concept_created_at = concept_created_at;
    this.concept_updated_at = concept_updated_at;
    this.concept_reviewed_at = concept_reviewed_at;
    this.concept_title = concept_title;
    this.concept_description = concept_description;
    this.concept_status = concept_status;
    this.concept_styling = concept_styling;
    this.concept_genre = concept_genre;
    this.user_id = user_id;
  }
}
