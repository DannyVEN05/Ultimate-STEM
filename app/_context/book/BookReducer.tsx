import { BookActionKind } from "@/app/_types/context";
import { Book } from "@/app/_types/model/Book";
import { Reducer } from "react";

export interface BookReducerState {
  books: Book[];
  status: string;
  isGridMode: boolean;
}

export type BookReducerAction = 
| { type: BookActionKind.SET_BOOKS; payload: Book[] }
| { type: BookActionKind.SET_STATUS; payload: string }
| { type: BookActionKind.TOGGLE_MODE; payload: boolean }
| { type: BookActionKind.UPDATE_LIKES; payload: {tournamentsub_id:string; newLikes:number} };

const bookReducer: Reducer<BookReducerState, BookReducerAction> = (state, action): BookReducerState => {
  switch (action.type){
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
        
    case BookActionKind.UPDATE_LIKES:
      return {
        ...state,
        books: state.books.map((book) => {
          return book.tournamentSubmission.tournamentsub_id === action.payload.tournamentsub_id 
          ? {...book, tournamentsub: { ...book.tournamentSubmission, tournamentsub_likes: action.payload.newLikes }}
          : book
        })
      };
    
    default:
      return state;
  }
};

export default bookReducer;