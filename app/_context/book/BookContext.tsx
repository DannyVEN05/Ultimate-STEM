"use client";

import { Book } from "@/app/_types/model/Book";
import { Concept } from "@/app/_types/model/Concept";
import { createContext } from "react";

export type BookContextType = {
  books: Book[];
  status: string;
  isGridMode: boolean;
  userConcepts: Concept[];
  setIsGridMode: (mode: boolean) => void;

  // This function fetches approved submissions for a specific tournament from Supabase and populates the books array. It combines Concept and TournamentSubmission data to create complete Book objects. The `tournament_id` argument should be a string.
  setBooks: (tournament_id: string) => Promise<void>;

  // This function updates the submission_likes table insçerting or deleting a composite key of user_id and tournamentsub_id. An Agggregate COUNT() can be applied to retrieve the number of likes
  updateLikes: (tournamentsub_id: string, isLiked: boolean) => Promise<boolean>;

  setUserConcepts: () => Promise<void>;
};

const BookContext = createContext({} as BookContextType)

export default BookContext;