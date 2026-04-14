"use client";

import React, { useReducer } from "react";
import bookReducer, { BookReducerState } from "./BookReducer";
import { Book } from "@/app/_types/model/Book";
import { supabase } from "@/lib/supabase";
import { BookActionKind } from "@/app/_types/context";
import BookContext from "./BookContext";

type Props = {
  children?: React.ReactNode | React.ReactNode[];
}

const BookState = ({ children }: Props) => {
  const initialState: BookReducerState = {
    books: [],
    status: "",
    isGridMode: true,
  }

  const [state, dispatch] = useReducer(bookReducer, initialState);

  const mapToBook = (row: any): Book => {
    const book = new Book(
      row.tournamentsub_id,
      row.tournamentsub_created_at ? new Date(row.tournamentsub_created_at) : null,
      row.tournamentsub_updated_at ? new Date(row.tournamentsub_updated_at) : null,
      row.tournament_id,
      row.tournamentsub_status,
      row.tournamentsub_likes,
      row.concept.concept_id,
      row.concept.concept_created_at ? new Date(row.concept.concept_created_at) : null,
      row.concept.concept_updated_at ? new Date(row.concept.concept_updated_at) : null,
      row.concept.concept_reviewed_at ? new Date(row.concept.concept_reviewed_at) : null,
      row.concept.concept_title,
      row.concept.concept_description,
      row.concept.concept_status,
      row.concept.concept_styling,
      row.concept.concept_genre,
      row.concept.user_id,
    )

    return book;
  }

  const setIsGridMode = (mode: boolean) => {
    dispatch({ type: BookActionKind.TOGGLE_MODE, payload: mode })
  }

  // Depending on the tournament_id, filter books into groups for displaying
  const setBooks = async () => {
    let mounted = true
    dispatch({ type: BookActionKind.SET_STATUS, payload: "loading" })

    try {
      const { data, error } = await supabase
        .from("tournament_submission")
        .select(`
          *,
          concept!inner(*)
        `).filter("concept.concept_reviewed_at", "not.is", null)

      if (error) {
        console.warn("Error fetching data: ", error);
        if (mounted) dispatch({ type: BookActionKind.SET_STATUS, payload: "error" })
        return;
      }

      if (!data || data.length === 0) {
        if (mounted) dispatch({ type: BookActionKind.SET_STATUS, payload: "ready" })
        return;
      };

      if (mounted) {
        const mappedBooks = data.map(mapToBook)
        dispatch({ type: BookActionKind.SET_BOOKS, payload: mappedBooks })
        dispatch({ type: BookActionKind.SET_STATUS, payload: "ready" })
      }

    } catch (err) {
      console.warn("Error fetching data: ", err)
      if (mounted) dispatch({ type: BookActionKind.SET_STATUS, payload: "error" })
    }
  }


  const updateLikes = async (tournamentsub_id: string, isLiked: boolean) => {
    const { error } = await supabase
      .rpc(isLiked ? "increment_tournamentsub_likes" : "decrement_tournamentsub_likes", {id: tournamentsub_id}
      );
    
    if (error) {
      console.warn(`Error: ${isLiked ? "incrementing" : "decrementing"}, Likes`, error)
    }
  }

  return (
    <BookContext.Provider
      value={{
        books: state.books,
        status: state.status,
        isGridMode: state.isGridMode,
        setIsGridMode,
        setBooks,
        updateLikes,
      }}
    >
      {children}
    </BookContext.Provider>
  );
}

export default BookState;