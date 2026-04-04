"use client";

import { Book } from "@/app/_types/model/Book";
import { createContext } from "react";

export type BookContextType = {
  books: Book[];
  status: string;
  isGridMode: boolean;
  setIsGridMode: (mode: boolean) => void;

  // This function sets the books array to contain all the tournament submissions that have been approved. It is a combination of Concept and TournamentSubmission data to create a complete Book object.
  setBooks: (books: Book[]) => Promise<void>;

  updateLikes: (submissionId: string, newLikes: number) => Promise<() => void>;
};

const BookContext = createContext({} as BookContextType)

export default BookContext;