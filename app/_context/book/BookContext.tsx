"use client";

import { Book } from "@/app/_types/model/Book";
import { createContext } from "react";

export type BookContextType = {
  books: Book[];
  status: string;
  isGridMode: boolean;
  setIsGridMode: (mode: boolean) => void;

  // This function fetches approved submissions for a specific tournament from Supabase and populates the books array. It combines Concept and TournamentSubmission data to create complete Book objects. The `tournament_id` argument should be a string.
  setBooks: (tournament_id: string) => Promise<void>;

  // This function updates the likes count for a specific tournament submission in the database. It takes the tournamentsub_id and a boolean indicating whether to increment or decrement the likes.
  updateLikes: (tournamentsub_id: string, isLiked: boolean) => Promise<void>;
};

const BookContext = createContext({} as BookContextType)

export default BookContext;