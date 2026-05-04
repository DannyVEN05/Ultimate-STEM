"use client";

import React, { useContext, useReducer } from "react";
import bookReducer, { BookReducerState } from "./BookReducer";
import { Book } from "@/app/_types/model/Book";
import { supabase } from "@/lib/supabase";
import { BookActionKind } from "@/app/_types/context";
import BookContext from "./BookContext";
import { BookCover } from "@/app/_types/model/Concept";
import AuthContext from "../auth/AuthContext";

type Props = {
  children?: React.ReactNode | React.ReactNode[];
}

const BookState = ({ children }: Props) => {
  const initialState: BookReducerState = {
    books: [],
    status: "",
    isGridMode: true,
    userConcepts: [],
  }

  const [state, dispatch] = useReducer(bookReducer, initialState);
  const { user } = useContext(AuthContext);

  const mapToBookCover = (styling: string | BookCover | any): BookCover => {
    let data = styling
    if (typeof styling === 'string') {
      try {
        data = JSON.parse(styling)
      } catch (err) {
        console.warn("Error parsing styling JSON: ", err)
        data = {}
      }
    }

    return {
      spine_color: data?.spine_color ?? '#000000',
      book_cover: data?.book_cover ?? '/covers/engineering.png',
      title: data?.title ?? 'Untitled',
      author: data?.author ?? 'Unknown Author',
      title_color: data?.title_color ?? '#FFFFFF',
      title_bg_color: data?.title_bg_color ?? 'transparent',
      author_color: data?.author_color ?? '#FFFFFF',
      author_bg_color: data?.author_bg_color ?? 'transparent',
      title_font: data?.title_font ?? 'sans-serif',
      author_font: data?.author_font ?? 'sans-serif',
      title_x: data?.title_x,
      title_y: data?.title_y,
      author_x: data?.author_x,
      author_y: data?.author_y,

    }
  }

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
      mapToBookCover(row.concept.concept_styling),
      row.concept.concept_genre,
      row.concept.user_id,
    )

    return book;
  }

  const setIsGridMode = (mode: boolean) => {
    dispatch({ type: BookActionKind.TOGGLE_MODE, payload: mode })
  }

  const setBooks = async (tournament_id: string) => {
    dispatch({ type: BookActionKind.SET_STATUS, payload: "loading" })

    try {
      const { data, error } = await supabase
        .from("tournament_submission")
        .select(`
          *,
          concept!inner(*)
        `)
        .eq("tournament_id", tournament_id)
        .eq("tournamentsub_status", "approved")

      if (error) {
        console.warn("Error fetching data: ", error);
        dispatch({ type: BookActionKind.SET_STATUS, payload: "error" })
        return;
      }

      if (!data || data.length === 0) {
        dispatch({ type: BookActionKind.SET_BOOKS, payload: [] })
        dispatch({ type: BookActionKind.SET_STATUS, payload: "ready" })
        return;
      };

      const mappedBooks = data.map(mapToBook)
      dispatch({ type: BookActionKind.SET_BOOKS, payload: mappedBooks })
      dispatch({ type: BookActionKind.SET_STATUS, payload: "ready" })

    } catch (err) {
      console.warn("Error fetching data: ", err)
      dispatch({ type: BookActionKind.SET_STATUS, payload: "error" })
    }
  }


  const updateLikes = async (tournamentsub_id: string, isLiked: boolean) => {
    const { error } = await supabase
      .rpc(isLiked ? "increment_tournamentsub_likes" : "decrement_tournamentsub_likes", { id: tournamentsub_id }
      );

    if (error) {
      console.warn(`Error: ${isLiked ? "incrementing" : "decrementing"}, Likes`, error)
    }
  }

  const setUserConcepts = async () => {
    try {
      if (!user) {
        console.warn("Error fetching user concepts: No user found.");
        return;
      }

      const { data, error } = await supabase
        .from("concept")
        .select("*")
        .eq("user_id", user.user_id);

      if (error) {
        console.warn("Error fetching user concepts: ", error);
        return;
      }

      const mappedConcepts = (data ?? []).map((concept) => ({
        ...concept,
        concept_styling: mapToBookCover(concept?.concept_styling),
      }));
      dispatch({ type: BookActionKind.SET_USER_CONCEPTS, payload: mappedConcepts });
    } catch (err) {
      console.warn("Unexpected error occurred: ", err);
    }
  }

  return (
    <BookContext.Provider
      value={{
        books: state.books,
        status: state.status,
        isGridMode: state.isGridMode,
        userConcepts: state.userConcepts,
        setIsGridMode,
        setBooks,
        updateLikes,
        setUserConcepts,
      }}
    >
      {children}
    </BookContext.Provider>
  );
}

export default BookState;