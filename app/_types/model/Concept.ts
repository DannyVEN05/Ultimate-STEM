// JSON attributes mapped out (potentially)
export type BookCover = Record<string, unknown>;


export class Concept {
  id: string;
  created_at: Date | null;
  updated_at: Date | null;
  reviewed_at: Date | null;
  title: string;
  description: string;
  status: string;
  styling: BookCover;
  genre: string;
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
    this.id = id;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.reviewed_at = reviewed_at;
    this.title = title;
    this.description = description;
    this.status = status;
    this.styling = styling;
    this.genre = genre;
    this.user_id = user_id;
  }
}