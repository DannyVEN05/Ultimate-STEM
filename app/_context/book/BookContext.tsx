"use client";

import { Book } from "@/app/_types/model/Book";
import { createContext } from "react";

export type BookContextType = {
  books: Book[];
  status: string;
  isGridMode: boolean;
  setIsGridMode: (mode: boolean) => void;

  // This function fetches all approved tournament submissions from Supabase and populates the books array. It is a combination of Concept and TournamentSubmission data to create a complete Book object.
  setBooks: (tournament_id: string) => Promise<void>;

  // This function updates the likes count for a specific tournament submission in the database. It takes the tournamentsub_id and a boolean indicating whether to increment or decrement the likes.
  updateLikes: (tournamentsub_id: string, isLiked: boolean) => Promise<void>;
};

const BookContext = createContext({} as BookContextType)

export default BookContext;