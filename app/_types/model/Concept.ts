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


export interface Concept {
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
}