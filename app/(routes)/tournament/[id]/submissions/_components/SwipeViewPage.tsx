"use client";

import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import BookContext from "@/app/_context/book/BookContext";
import AuthContext from "@/app/_context/auth/AuthContext";
import { Book } from "@/app/_types/model/Book";
import BookCard from "./GridBookCard";

type SwipeViewProps = {
  showingLiked: boolean;
  onLikedToggle: () => void;
}


const SwipeViewPage: React.FC<SwipeViewProps> = ({
  showingLiked,
  onLikedToggle,
}) => {
  const { books } = useContext(BookContext);
  const { user } = useContext(AuthContext);
  const { updateLikes } = useContext(BookContext);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<"yes" | "no" | "unlike" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const browseBooks = books.filter(book => !book.isLiked);
  const likedBooks = books.filter(book => book.isLiked);
  const activeBooks = showingLiked ? likedBooks : browseBooks;

  const currentBook: Book = activeBooks[currentIndex];
  const hasBook = Boolean(currentBook);


  const handleYes = async () => {
    if (!user || isProcessing || !currentBook) return;

    setIsProcessing(true);
    setFeedback("yes");

    const success = await updateLikes(currentBook.tournamentsub_id, true);

    if (success) {
      // Advance to next book — liked book naturally leaves browseBooks
      // on next render since isLiked flips in context
      setCurrentIndex(prev => Math.min(prev + 1, activeBooks.length));
    }
    window.setTimeout(() => setFeedback(null), 900);
    setIsProcessing(false);
  };

  const handleNo = () => {
    if (!user || isProcessing || !currentBook) return;

    setFeedback("no");
    // Just skip — no DB call in browse mode
    setCurrentIndex(prev => Math.min(prev + 1, activeBooks.length));
    window.setTimeout(() => setFeedback(null), 900);
  };

  const handleUnlike = async () => {
    if (!user || isProcessing || !currentBook) return;

    setIsProcessing(true);
    setFeedback("unlike");

    const success = await updateLikes(currentBook.tournamentsub_id, false);

    if (success) {
      setCurrentIndex(prev => Math.min(prev + 1, activeBooks.length));
    }

    window.setTimeout(() => setFeedback(null), 900);
    setIsProcessing(false);
  };

  const restartSwipe = () => {
    setCurrentIndex(0);
    setFeedback(null);
  };


  return (
    <>
      <div className="flex h-full w-full">

        {/* Book 1 of 1 ------ Book Genre Components */}
        {/* <div className="p-2 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
        <span>{`Book ${currentIndex + 1} of ${books.length}`}</span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm">{currentBook.concept_genre || "Unknown"}</span>
      </div> */}


        <div className="flex-1 grid grid-cols-3 items-center w-full h-full">
          <div className="flex justify-center gap-4">
            <Button
              onClick={showingLiked ? handleUnlike : handleNo}
              variant="destructive"
              disabled={!hasBook || isProcessing}
              className="w-[40%] rounded-full py-4 text-lg font-semibold"
            >
              {showingLiked ? "Unlike" : "No"}
            </Button>
          </div>

          {books.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
              <p className="text-xl font-semibold">No books to vote on yet.</p>
              <p className="mt-2 text-gray-600">Check back when new submissions are available.</p>
            </div>
          ) : !hasBook ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <p className="text-xl font-semibold">No more books to vote on right now.</p>
              <p className="mt-2 text-gray-600">You’ve finished voting on the current queue. Please return to Grid.</p>
              <Button variant="secondary" className="mt-2 px-8 py-3" onClick={restartSwipe}>Restart voting</Button>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center min-h-0">
              <div className="w-full h-full max-h-[65vh]">
                <BookCard
                  key={currentBook.tournamentsub_id}
                  title={currentBook.concept_title}
                  description={currentBook.concept_description}
                  genre={currentBook.concept_genre}
                  tournamentsub_id={currentBook.tournamentsub_id}
                  styling={currentBook.concept_styling}
                  isLiked={currentBook.isLiked}
                  aspectRatio="aspect-[3/4]"
                />
              </div>
            </div>
          )}

          <div className="gap-4 flex justify-center">
            {!showingLiked && (
              <Button
                onClick={handleYes}
                variant="secondary"
                disabled={!hasBook || isProcessing}
                className="w-[40%] rounded-full font-semibold text-lg bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500"
              >
                Yes
              </Button>
            )}
          </div>
        </div>

      </ div>
      {feedback && (
        <div className={`fixed bottom-20 left-10 p-2 rounded-3xl text-center text-sm font-semibold ${feedback === "unlike" ? "bg-red-100 text-red-700" : feedback === "yes" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
          {feedback === "unlike" ? "Book Unliked" : feedback === "yes" ? "Book Liked!" : "Skipping book... "}
        </div>
      )}
    </>
  );
};

export default SwipeViewPage