import { BookActionKind } from "@/app/_types/context";
import { Book } from "@/app/_types/model/Book";
import { Concept } from "@/app/_types/model/Concept";
import { Reducer } from "react";

export interface BookReducerState {
  books: Book[];
  status: string;
  isGridMode: boolean;
  userConcepts: Concept[];
}

export type BookReducerAction =
  | { type: BookActionKind.SET_BOOKS; payload: Book[] }
  | { type: BookActionKind.SET_STATUS; payload: string }
  | { type: BookActionKind.TOGGLE_MODE; payload: boolean }
  | { type: BookActionKind.UPDATE_LIKES; payload: { tournamentsub_id: string, isAdding: boolean } }
  | { type: BookActionKind.SET_USER_CONCEPTS; payload: Concept[] };

const bookReducer: Reducer<BookReducerState, BookReducerAction> = (state, action): BookReducerState => {
  switch (action.type) {
    case BookActionKind.SET_BOOKS:
      return {
        ...state,
        books: action.payload ?? [],
      };

    case BookActionKind.SET_STATUS:
      return {
        ...state,
        status: action.payload,
      };

    case BookActionKind.TOGGLE_MODE:
      return {
        ...state,
        isGridMode: action.payload,
      };

    // Currently not being used as likes are updated directly in the database without worrying about errors.
    case BookActionKind.UPDATE_LIKES:
      return {
        ...state,
        books: state.books.map((book) => {
          return book.tournamentsub_id === action.payload.tournamentsub_id
            ? { ...book, tournamentsub_likes: action.payload.isAdding ? book.tournamentsub_likes + 1 : book.tournamentsub_likes - 1 }
            : book
        })
      };

    case BookActionKind.SET_USER_CONCEPTS:
      return {
        ...state,
        userConcepts: action.payload,
      }

    default:
      return state;
  }
};

export default bookReducer;