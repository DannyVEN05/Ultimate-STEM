"use client";

import BookContext from "@/app/_context/book/BookContext";
import { useContext, useEffect, useRef } from "react";

const GridViewPage = () => {
  const { books, setBooks } = useContext(BookContext);
  const setBooksRef = useRef(setBooks);

  useEffect(() => {
    setBooksRef.current(books);
  }, []);

  return (
    <div className="mt-3 grid w-full gap-4 sm:grid-cols-4 md:grid-cols-8">
      {books.map((book) => (
        <div key={book.tournamentsub_id} className="flex flex-col items-center">
          <p className="mt-2 font-bold">{book.concept_title}</p>
        </div>
      ))}
    </div>
  );
};

export default GridViewPage;