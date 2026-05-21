"use client";

import { useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import BookContext from "@/app/_context/book/BookContext";
import AuthContext from "@/app/_context/auth/AuthContext";
import { Book } from "@/app/_types/model/Book";
import BookCard from "./SubmissionBookCard";

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
  const [feedback, setFeedback] = useState<"like" | "skip" | "unlike" | "error" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const browseBooks = books.filter(book => !book.isLiked);
  const likedBooks = books.filter(book => book.isLiked);
  const activeBooks = showingLiked ? likedBooks : browseBooks;

  const currentBook: Book | undefined = activeBooks[currentIndex];
  const hasBook = Boolean(currentBook);


  const handleYes = async () => {
    if (!user || isProcessing || !currentBook) return;

    setIsProcessing(true);
    const success = await updateLikes(currentBook.tournamentsub_id, true);

    if (!success) {
      console.warn("Updating like was unsuccessful")
      setFeedback("error");
    }
    setFeedback("like");
    window.setTimeout(() => setFeedback(null), 900);
    setIsProcessing(false);
  };

  const handleSkip = () => {
    if (!user || isProcessing || !currentBook) return;

    setFeedback("skip");
    setCurrentIndex(prev => Math.min(prev + 1, activeBooks.length));
    window.setTimeout(() => setFeedback(null), 900);
  };

  const handleUnlike = async () => {
    if (!user || isProcessing || !currentBook) return;

    setIsProcessing(true);
    const success = await updateLikes(currentBook.tournamentsub_id, false);

    if (!success) {
      setFeedback("error");
      console.warn("Unliking was unsuccessful, Book Title: ", currentBook.concept_title)
    }

    setFeedback("unlike");
    window.setTimeout(() => setFeedback(null), 900);
    setIsProcessing(false);
  };

  const restartSwipe = () => {
    if (showingLiked) {
      onLikedToggle();
    }
    setCurrentIndex(0);
    setFeedback(null);
  };

  useEffect(() => {
    if (showingLiked && likedBooks.length === 0) {
      onLikedToggle();
      setCurrentIndex(0);
    }
  }, [likedBooks.length, showingLiked, onLikedToggle])

  useEffect(() => {
    setCurrentIndex(0); // reset when user manually toggles mode
  }, [showingLiked]);

  return (
    <>
      <div className="flex h-full w-full">
        <div className="flex-1 grid grid-cols-3 items-center w-full h-full">
          <div className="flex justify-center gap-4">
            <Button
              onClick={showingLiked ? handleUnlike : handleSkip}
              variant="destructive"
              disabled={!hasBook || isProcessing}
              className="w-[40%] rounded-full py-4 text-lg font-semibold">
              {showingLiked ? "Unlike" : "Skip"}
            </Button>
          </div>

          {books.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
              <p className="text-xl font-semibold">No books to vote on yet.</ p>
              <p className="mt-2 text-gray-600">Check back when new submissions are available.</ p>
            </div>
          ) : !hasBook ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              < p className="text-xl font-semibold">
                {showingLiked ? "End of Liked Books list." : "No more books to vote on right now."}
              </p>
              <p className="mt-2 text-gray-600">Please return to Grid or Browse Books.</p>
              {!showingLiked && (
                < Button variant="secondary" className="mt-2 px-8 py-3" onClick={restartSwipe}>Restart voting</ Button>
              )}
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center min-h-0">
              <div className="h-full min-h-[65vh]">
                <BookCard
                  key={currentBook.tournamentsub_id}
                  title={currentBook.concept_title}
                  description={currentBook.concept_description}
                  tournamentsub_id={currentBook.tournamentsub_id}
                  styling={currentBook.concept_styling}
                  isLiked={currentBook.isLiked}
                  aspectRatio="aspect-[3/4]"
                  minHeight="min-h-[65vh]"
                />
              </div>
            </div>
          )}

          <div className="gap-4 flex justify-center">
            {(
              <Button
                onClick={showingLiked ? handleSkip : handleYes}
                variant="secondary"
                disabled={!hasBook || isProcessing}
                className="w-[40%] rounded-full font-semibold text-lg bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500">
                {showingLiked ? "Skip" : "Like"}
              </Button>
            )}
          </div>
        </div>

      </div>
      {feedback && (
        <div className={`fixed bottom-20 left-10 p-2 rounded-3xl text-center text-sm font-semibold ${feedback === "error" ? "bg-red-400 text-white" : feedback === "unlike" ? "bg-red-100 text-red-700" : feedback === "like" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
          {feedback === "error" ? "Error!" : feedback === "unlike" ? "Book Unliked" : feedback === "like" ? "Book Liked!" : "Skipping book... "}
        </div>
      )}
    </>
  );
};

export default SwipeViewPage