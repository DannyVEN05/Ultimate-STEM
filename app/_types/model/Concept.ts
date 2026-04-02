// JSON attributes mapped out (potentially)
export type BookCover = Record<string, unknown>;


export class Concept {
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
    id: string = '',
    created_at: Date | null = null,
    updated_at: Date | null = null,
    reviewed_at: Date | null = null,
    title: string = '',
    description: string = '',
    status: string = '',
    styling: BookCover = {},
    genre: string = '',
    user_id: string = ''
  ) {
    this.concept_id = id;
    this.concept_created_at = created_at;
    this.concept_updated_at = updated_at;
    this.concept_reviewed_at = reviewed_at;
    this.concept_title = title;
    this.concept_description = description;
    this.concept_status = status;
    this.concept_styling = styling;
    this.concept_genre = genre;
    this.user_id = user_id;
  }
}