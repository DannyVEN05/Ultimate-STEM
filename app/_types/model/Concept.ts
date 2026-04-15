export type BookCover = {
  spine_color: string,        // "#000000" <- e.g hex code for spine color
  book_cover: string,         // Path to supabase storage (potentially)
  title: string,
  author: string,
  title_color: string,
  title_bg_color: string,
  author_color: string,
  author_bg_color: string,
  title_font: string,
  author_font: string,
  title_x: number,            // Positioning attributes for title and author
  title_y: number,
  author_x: number,
  author_y: number; 
}


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
    styling: BookCover = {
      spine_color: '',
      book_cover: '',
      title: '',
      author: '',
      title_color: '',
      title_bg_color: '',
      author_color: '',
      author_bg_color: '',
      title_font: '',
      author_font: '',
      title_x: 20,
      title_y: 40,
      author_x: 20,
      author_y: 100,
    },
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