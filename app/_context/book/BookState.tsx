"use client";

import React, { useReducer } from "react";
import bookReducer, { BookReducerState } from "./BookReducer";
import { Concept } from "@/app/_types/model/Concept";
import { Book } from "@/app/_types/model/Book";
import { TournamentSubmission } from "@/app/_types/model/TournamentSubmission";
import { supabase } from "@/lib/supabase";
import { BookActionKind } from "@/app/_types/context";
import BookContext from "./BookContext";

type Props = {
  children?: React.ReactNode | React.ReactNode[];
}

const BookState = ( {children}: Props ) => {
  const initialState: BookReducerState = {
    books: [],
    status: '',
    isGridMode: true
  }

  const [state, dispatch] = useReducer(bookReducer, initialState);

  const mapToBook = (row: any): Book => {
    // Creating Concept (Nested Object)
    const concept = new Concept(
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

    // Creating TournamentSubmission (Top-Level Object)
    const tournamentsub = new TournamentSubmission (
      row.tournamentsub_id,
      row.tournamentsub_created_at ? new Date(row.tournamentsub_created_at) : null,
      row.tournamentsub_updated_at ? new Date(row.tournamentsub_updated_at) : null,
      row.tournamentsub_likes,
      row.tournamentsub_status,    
      row.tournament_id,
      row.concept_id
    )

    return new Book(concept, tournamentsub);
  }

  /* 
  If a TournamentSubmission exists in your database but the Concept it points to was deleted (or has a broken foreign key),
  Supabase will return null for the concept field.
  */
  
  const setIsGridMode = (mode: boolean) => {
    dispatch({ type:BookActionKind.TOGGLE_MODE, payload: mode})
  }

  // Depending on the tournament_id, filter books into groups for displaying
  const setBooks = async () => {
    let mounted = true
    dispatch({ type:BookActionKind.SET_STATUS, payload: 'loading' })
    
    console.log("Fetching books")

    try {
      const {data, error} = await supabase
        .from('tournament_submission')
        .select(`
          *,
          concept!inner(*)
        `).filter('concept.concept_reviewed_at', 'not.is', null)

      if (!data) {console.log("Data is empty or undefined")}
      else {console.log("Data successfully received!")}
      
      if (error) throw error

      if (mounted) {
        console.log("Begin mapping books")
        const mappedBooks = data.map(mapToBook)
        dispatch({ type:BookActionKind.SET_BOOKS, payload: mappedBooks })
        dispatch({ type:BookActionKind.SET_STATUS, payload: 'ready' })
        console.log("Mapping complete, books should be displayed!")
      }

    } catch (err) {
      console.warn('Error fetching data', err)
      if (mounted) dispatch({ type:BookActionKind.SET_STATUS, payload: 'error' })
    }
  }
  

  const updateLikes = async () => {
    // Below function is currently not working as a realtime EventListener
    // Under development
    let mounted = true

    const channel = supabase.channel('tournament_submission_changes')
      .on(
        'postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table:'tournament_submission'
        },
        (payload) => {
          console.log('Receiving data: ', payload)
          if(mounted && payload.eventType === 'UPDATE'){
            dispatch({ type:BookActionKind.UPDATE_LIKES, payload: {
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