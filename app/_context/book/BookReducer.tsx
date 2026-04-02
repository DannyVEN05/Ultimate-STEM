import { BookActionKind } from "@/app/_types/context";
import { Book } from "@/app/_types/model/Book";
import { Reducer } from "react";

export interface BookReducerState {
  books: Book[];
  isLoading: boolean;
  isGridMode: boolean;
}

export type BookReducerAction = 
| { type: BookActionKind.SET_BOOKS; payload: Book[] }
| { type: BookActionKind.SET_LOADING; payload: boolean }
| { type: BookActionKind.TOGGLE_MODE; payload: boolean }
| { type: BookActionKind.UPDATE_LIKES; payload: {tournamentsub_id:string; newLikes:number} };

const bookReducer: Reducer<BookReducerState, BookReducerAction> = (state, action): BookReducerState => {
  switch (action.type){
    case BookActionKind.SET_BOOKS:
      return {
        ...state,
        books: action.payload,
        isLoading: false,
      };

    case BookActionKind.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
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
          return book.tournamentSubmission.id === action.payload.tournamentsub_id 
          ? {...book, tournamentsub: { ...book.tournamentSubmission, likes: action.payload.newLikes }}
          : book
        })
      };
    
    default:
      return state;
  }
};

export default bookReducer;