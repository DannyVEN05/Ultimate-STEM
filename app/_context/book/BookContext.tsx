"use client";

import { Book } from "@/app/_types/model/Book";
import { createContext } from "react";

export type BookContextType = {
  books: Book[];
  status: string;
  isGridMode: boolean;
  setIsGridMode: (mode: boolean) => void;
  updateLikes: (tournamentsub_id: string, isLiked: boolean) => void;

  // This function fetches all approved tournament submissions from Supabase and populates the books array. It is a combination of Concept and TournamentSubmission data to create a complete Book object.
  setBooks: () => Promise<void>;
};

const BookContext = createContext({} as BookContextType)

export default BookContext;