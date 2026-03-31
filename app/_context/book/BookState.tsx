"use client";

import React, { useReducer, useEffect } from "react";
import bookReducer, { BookReducerState } from "./BookReducer";
import { Concept } from "@/app/_types/model/Concept";
import { Book } from "@/app/_types/model/Book";
import { TournamentSubmission } from "@/app/_types/model/TournamentSubmission";

type Props = {
  children?: React.ReactNode | React.ReactNode[];
}

const BookState = ( {children}: Props ) => {
  const initialState: BookReducerState = {
    books: [],
    isLoading: true,
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

    /*  Example JSON
    {
      "tournamentsub_id": "foo",
      "tournamentsub_likes": 15,
      "concept": {
        "concept_id": "foobar",
        "concept_title": "STEM for you"  
      }
    }
    */
    return new Book(concept, tournamentsub);
  }

  /* Issue 1 - If a TournamentSubmission exists in your database but the Concept it points to was deleted (or has a broken foreign key),
     Supabase will return null for the concept field.
     NOTE: Updating Concept data in Book may be difficult as code need to tell supabase to target the concept table not the tournament sub table
  */
}