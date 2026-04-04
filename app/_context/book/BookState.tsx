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
    isGridMode: true
  }

  const [state, dispatch] = useReducer(bookReducer, initialState);

  const mapToBook = (row: any): Book => {
    const book = new Book(
      row.tournamentsub_id,
      row.tournamentsub_created_at,
      row.tournamentsub_updated_at,
      row.tournament_id,
      row.tournamentsub_status,
      row.tournamentsub_likes,
      row.concept.concept_id,
      row.concept.concept_created_at,
      row.concept.concept_updated_at,
      row.concept.concept_reviewed_at,
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

      if (!data) {
        if (mounted) dispatch({ type: BookActionKind.SET_STATUS, payload: "ready" })
        return;
      }

      if (error) {
        console.warn("Error fetching data: ", error);
        if (mounted) dispatch({ type: BookActionKind.SET_STATUS, payload: "error" })
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


  const updateLikes = async () => {
    // Below function is currently not working as a realtime EventListener
    // Under development
    let mounted = true

    const channel = supabase.channel("tournament_submission_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournament_submission"
        },
        (payload) => {
          console.log("Receiving data: ", payload)
          if (mounted && payload.eventType === "UPDATE") {
            dispatch({
              type: BookActionKind.UPDATE_LIKES, payload: {
                tournamentsub_id: payload.new.tournamentsub_id,
                newLikes: payload.new.tournamentsub_likes,
              }
            })
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
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