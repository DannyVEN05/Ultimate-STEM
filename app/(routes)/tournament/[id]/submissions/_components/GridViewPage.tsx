"use client";

import BookContext from "@/app/_context/book/BookContext";
import { useContext, useEffect, useRef } from "react";
import BookCard from "./BookCard";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const GridViewPage = () => {
  const { books, setBooks } = useContext(BookContext);
  const params = useParams();
  const id = params.id;
  const setBooksRef = useRef(setBooks);
  
  useEffect(() => {
    setBooksRef.current(id as string);
    
    // Testing channel for BookContext's setBooks function
    const channel = supabase
      .channel(`tournament-${id}`)
      .on(
        `postgres_changes`, 
        {
          event: '*', 
          schema: 'public', 
          table: 'tournament_submission'
        }, 
        (payload) => {
          console.log(`Change received`, payload);
          setBooksRef.current(id as string);
          }
      ).subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
  }, [id]);

  return (
    <div className="pt-8 w-full grid grid-cols-6 gap-6">
      {books.map((book) => (
        <BookCard 
          key={book.tournamentsub_id} 
          title={book.concept_title} 
          author= {"Loading..."} 
          description={book.concept_description} 
          genre={book.concept_genre} 
          tournamentsub_id={book.tournamentsub_id} 
          styling={book.concept_styling}
        />
      ))}
    </div>
  );
};

export default GridViewPage;