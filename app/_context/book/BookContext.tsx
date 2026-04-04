"use client";

import { Book } from "@/app/_types/model/Book";
import { createContext } from "react";

export type BookContextType = {
  books: Book[];
  status: string;
  isGridMode: boolean;
  setIsGridMode: (mode:boolean) => void;
  setBooks: (books: Book[]) => void;
  updateLikes: (submissionId: string, newLikes: number) => void;
};

const BookContext = createContext({} as BookContextType)

export default BookContext;