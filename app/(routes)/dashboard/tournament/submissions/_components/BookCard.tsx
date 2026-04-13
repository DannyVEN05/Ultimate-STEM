import BookContext from "@/app/_context/book/BookContext";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useState, useContext } from "react";
import { MouseEvent } from "react";

type BookCardProps = {
  title: string;
  genre: string;
  tournamentsub_id: string;
}

const BookCard = (props: BookCardProps) => {
  const [ isLiked, setIsLiked ] = useState(false);
  const [ isProcessing, setIsProcessing ] = useState(false);
  const { updateLikes } = useContext(BookContext);

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
    <div className="p-4 h-full rounded-xl border border-gray-200">
      <div className="absolute -top-3 -right-3">
        <Button variant="default" className="group min-h-8 min-w-8 rounded-full hover:-translate-y-1" onClick={handleClickLike}>
          <Heart className={`size-6 cursor-pointer transition-all ${isLiked ? " text-red-500 fill-red-500" : "fill-transparent group-hover:fill-red-500 group-hover:text-red-500"} `}>
          </Heart>
        </Button>
      </div>
      <div className="items-center">
        <div className="aspect-[210/297] w-full bg-white shadow-md rounded-lg hover:shadow-xl transform transition hover:-translate-y-1"></div>
        <div className="flex flex-col pt-3">
          <h3 className="text-md font-bold">{props.title}</h3>
          <p className="text-xs text-muted-foreground"><strong>Genre:</strong> {props.genre}</p>
        </div>
      </div>
    </div>
  )
};

export default BookCard;