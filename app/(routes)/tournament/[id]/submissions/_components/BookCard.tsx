import BookContext from "@/app/_context/book/BookContext";
import { BookCover } from "@/app/_types/model/Concept";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Heart } from "lucide-react";
import { useState, useContext } from "react";
import { MouseEvent } from "react";

type BookCardProps = {
  title: string;
  author: string;
  description: string;
  genre: string;
  tournamentsub_id: string;
  styling: BookCover;
}

const BookCard = (props: BookCardProps) => {
  const [ isLiked, setIsLiked ] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ isProcessing, setIsProcessing ] = useState(false);
  const { updateLikes } = useContext(BookContext);

  const { data } = supabase.storage.from('book-covers').getPublicUrl(props.styling.book_cover);
  const coverUrl = data?.publicUrl || '/covers/engineering.png';

  async function handleClickLike(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();

    if(isProcessing) return;

    setIsProcessing(true);
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);

    await updateLikes(props.tournamentsub_id, nextLiked);
    setIsProcessing(false)
  }
  return (
    <div className={`perspective-[1200px] transition-all duration-500 ${isFlipped ? "z-50" : "z-10"}`}>
      <div
        className={`relative w-full transition-all duration-700 [transform-style:preserve-3d] ${
          isFlipped 
            ? "[transform:rotateY(180deg)]" 
            : "hover:[transform:rotateY(8deg)]"
        }`}
      >
        <div 
          onClick={() => setIsFlipped(true)}
          className="absolute-inset-0 rounded-xl shadow-sm hover:shadow-md cursor-pointer [backface-visibility:hidden]"
        >
          <div className={`relative w-full bg-secondary/50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:bg-secondary/50`}>
            <div className="p-4 h-full rounded-xl border border-gray-200 z-8">
              <div className="absolute -top-3 -right-3 z-10">
                <Button variant="default" className="group min-h-12 min-w-12 rounded-full hover:-translate-y-1" onClick={handleClickLike}>
                  <Heart className={`size-7 cursor-pointer transition-all ${isLiked ? " text-red-500 fill-red-500" : "fill-transparent group-hover:fill-red-500 group-hover:text-red-500"} `}>
                  </Heart>
                </Button>
              </div>
              <div className="items-center">
                <img src={coverUrl} alt={`${props.title} cover`} className="aspect-[210/297] w-full bg-white shadow-md rounded-lg hover:shadow-xl transform transition"
                ></img>
                <div className="flex flex-col pt-3">
                  <h3 className="text-md font-bold truncate">{props.title}</h3>
                  <p className="text-xs text-muted-foreground"><strong>Author:</strong> {props.author}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          onClick={() => setIsFlipped(false)}
          className="absolute inset-0 p-6 rounded-xl border border-gray-200 bg-secondary/90 shadow-2xl flex flex-col [transform:rotateY(180deg)] [backface-visibility:hidden] cursor-pointer"
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <p className="text-[10px] text-gray-700 leading-snug">
                {props.description}
              </p>
            </div>
            <div className="mt-4 pt-4">
              <p className="text-[9px] text-center text-gray-700 font-medium animate-pulse">
                Click to flip back
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
};

export default BookCard;