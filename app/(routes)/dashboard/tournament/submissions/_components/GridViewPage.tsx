"use client";

import BookContext from "@/app/_context/book/BookContext";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";

type BookCardProps = {
  title: string;
  genre: string;
  tournamentsub_id: string;
}

const GridViewPage = () => {
  const { books, setBooks } = useContext(BookContext);
  const { updateLikes } = useContext(BookContext);
  const setBooksRef = useRef(setBooks);
  
  useEffect(() => {
    setBooksRef.current();
  }, []);

  const BookCard = (props:BookCardProps) => {
    const [ isLiked, setIsLiked ] = useState(false);
    const [ isProcessing, setisProcessing ] = useState(false);

    async function handleClickLike(e: React.MouseEvent) {
      e.stopPropagation();

      if(isProcessing) return;

      setisProcessing(true);
      const nextLiked = !isLiked;
      setIsLiked(nextLiked);

      await updateLikes(props.tournamentsub_id, nextLiked);
      setisProcessing(false);
    }

    return (
      <div className="p-4 h-full rounded-xl border border-gray-200">
        <div className="absolute -top-3 -right-3">
          <Button variant="default" className="group min-h-8 min-w-8 rounded-full hover:-translate-y-1" onClick={handleClickLike}>
            <Heart className={`size-6 cursor-pointer transition-all ${isLiked ? " text-red-500 fill-red-500" : "fill-transparent group-hover:fill-red-500 group-hover:text-red-500"} `}>

            </Heart>
          </Button>
        </div>
        <div className="flex-col items-center">
          <div className="aspect-[210/297] w-full max-h-3/4 bg-white shadow-md rounded-lg hover:shadow-xl transform transition hover:-translate-y-1"></div>
          <div className="flex-col pt-3">
            <h3 className="text-md font-bold">{props.title}</h3>
            <p className="text-xs text-muted-foreground"><strong>Genre:</strong> {props.genre}</p>
          </div>
        </div>
      </div>
    )
  }

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