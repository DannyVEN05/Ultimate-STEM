"use client";

import React, { useReducer, useEffect } from "react";
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
      row.concept.concept_user_id,
    )
    console.log("Concept: ", concept)

    // Creating TournamentSubmission (Top-Level Object)
    const tournamentsub = new TournamentSubmission (
      row.tournamentsub_id,
      row.tournamentsub_created_at ? new Date(row.created_at) : null,
      row.tournamentsub_updated_at ? new Date(row.created_at) : null,
      row.tournamentsub_likes,
      row.tournamentsub_status,    
      row.tournament_id,
      row.concept_id
    )
    console.log("Tournament Submission: ", tournamentsub)

    return new Book(concept, tournamentsub);
  }

  /* Issue 1 - If a TournamentSubmission exists in your database but the Concept it points to was deleted (or has a broken foreign key),
     Supabase will return null for the concept field.
     NOTE: Updating Concept data in Book may be difficult as code need to tell supabase to target the concept table not the tournament sub table
  */
  
  useEffect(() => {
    let mounted = true
    const fetchBooks = async () => {
      dispatch({ type:BookActionKind.SET_STATUS, payload: 'loading' })
      
      console.log("Started fetching books")

      try {
        const {data, error} = await supabase
          .from('tournament_submission')
          .select(`
            *,
            concept!inner(*)
          `)

        console.log('Data received: ',data)
        
        if (error) throw error

        if (mounted) {
          const mappedBooks = data.map(mapToBook)
          dispatch({ type:BookActionKind.SET_BOOKS, payload: mappedBooks })
          dispatch({ type:BookActionKind.SET_STATUS, payload: 'ready' })
        }

      } catch (err) {
        console.warn('Error fetching tournament submissions', err)
        if (mounted) dispatch({ type:BookActionKind.SET_STATUS, payload: 'error' })
      }
    }
    fetchBooks()

   // Displaying is reliant on reviewing filter with .eq(confrimed_at, !null)
   // Depending on the tournament_id, filter books into groups for displaying
   // Below function is currently not working as a realtime EventListener
   // Have to reload the page to refresh the grid

    const channel = supabase.channel('tounament_submission_changes')
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
              id: payload.new.tournamentsub_id,
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
  }, []);

  // These 3 functions will stay empty for now
  const setIsGridMode = async () => {
    
  }
  const setBooks = async () => {

  }
  const updateLikes = async () => {

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