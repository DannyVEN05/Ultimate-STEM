"use client";

import BookContext from "@/app/_context/book/BookContext";
import { useContext, useEffect, useRef } from "react";
import BookCard from "./BookCard";

const GridViewPage = () => {
  const { books, setBooks } = useContext(BookContext);
  const setBooksRef = useRef(setBooks);
  
  useEffect(() => {
    setBooksRef.current();
  }, []);

  return (
    <div className="mt-5 w-full grid grid-cols-6 gap-6">
      {books.map((book) => (
        <div key={book.tournamentsub_id} className={`relative w-full bg-secondary/30 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:bg-secondary/50`}>
          <BookCard title={book.concept_title} genre={book.concept_genre} tournamentsub_id={book.tournamentsub_id}/>
        </div>
      ))}
    </div>
  );
};

export default GridViewPage;