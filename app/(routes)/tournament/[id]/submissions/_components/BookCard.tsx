import BookContext from "@/app/_context/book/BookContext";
import { BookCover } from "@/app/_types/model/Concept";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Heart } from "lucide-react";
import CoverImage from "./CoverImage";
import { useState, useContext, useEffect, useMemo } from "react";
import { MouseEvent } from "react";

type BookCardProps = {
  title: string;
  description: string;
  genre: string;
  tournamentsub_id: string;
  styling: BookCover;
  isLiked: boolean;
  showLikeButton?: boolean;
}

// Perhaps 

const BookCard: React.FC<BookCardProps> = ({
  title,
  description,
  genre,
  tournamentsub_id,
  styling,
  isLiked: initialIsLiked,
  showLikeButton = false,
}) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { updateLikes } = useContext(BookContext);

  useEffect(() => {
    setIsLiked(isLiked)
  }, [isLiked])

  async function handleClickLike(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();

    if (isProcessing) return;

    setIsProcessing(true);
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);

    const success = await updateLikes(tournamentsub_id, nextLiked);
    if (!success) {
      setIsLiked(!nextLiked); // Rollback UI state if update fails
    }
    setIsProcessing(false)
  }

  return (
    <div className={`perspective-[1200px] ${isFlipped ? "z-50" : "z-10"}`}>
      <div
        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] will-change-transform ${isFlipped
          ? "[transform:rotateY(180deg)]"
          : "hover:[transform:rotateY(4deg)]"
          }`}
      >
        {/* Front Face */}
        <div
          onClick={() => setIsFlipped(true)}
          role="button"
          className="relative w-full h-full [backface-visibility:hidden] z-20"
        >
          <div className="w-full bg-secondary/50 rounded-xl shadow-md hover:bg-secondary/60">
            <div className="p-4 h-full rounded-xl border border-gray-200 z-[8]">

              {showLikeButton && (
                <div className="absolute -top-3 -right-3 z-10">
                  <Button variant="default" className="group min-h-12 min-w-12 rounded-full hover:bg-primary/90" onClick={handleClickLike}>
                    <Heart className={`size-7 cursor-pointer transition-all ${isLiked ? " text-red-500 fill-red-500" : "fill-transparent"} `}>
                    </Heart>
                  </Button>
                </div>
              )}

              <CoverImage styling={styling} title={title}></CoverImage>
              <h3 className="mt-3 text-sm text-gray-600 font-bold line-clamp-2">{title}</h3>
            </div>
          </div>
        </div>

        {/* Back Face */}
        <div
          onClick={() => setIsFlipped(false)}
          role="button"
          className="absolute inset-0 cursor-pointer p-6 rounded-xl border border-gray-200 bg-secondary/90 shadow-2xl [transform:rotateY(180deg)] [backface-visibility:hidden]"
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <p className="text-[10px] text-gray-600 leading-snug">
                {description}
              </p>
            </div>
            <div className="mt-4 pt-4">
              <p className="text-[9px] text-center text-gray-700 font-medium">
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