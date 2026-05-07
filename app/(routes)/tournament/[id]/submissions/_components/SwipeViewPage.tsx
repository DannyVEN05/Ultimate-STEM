"use client";

import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import BookContext from "@/app/_context/book/BookContext";
import AuthContext from "@/app/_context/auth/AuthContext";
import { Book } from "@/app/_types/model/Book";
import BookCard from "./BookCard";


const SwipeViewPage = () => {
  const { books } = useContext(BookContext);
  const { user } = useContext(AuthContext);
  // const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  const handleChoice = (choice: "yes" | "no") => {
    setFeedback(choice);
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, books.length));
    window.setTimeout(() => setFeedback(null), 900);
  };

  const restartSwipe = () => {
    setCurrentIndex(0);
    setFeedback(null);
  };

  // if (loading) {
  //   return (
  //     <div className="flex w-full flex-col items-center mt-10">
  //       <p className="text-lg">Loading books...</p>
  //     </div>
  //   );
  // }

  // Need to Filter books depending on whether it has been liked for a specific user
  // If they press 'Show Liked Books' it should filter the contradiction of above
  const currentBook: Book = books[currentIndex];
  const hasBook = Boolean(currentBook);

  return (
    <div className="flex flex-col">

      {/* Book 1 of 1 ------ Book Genre Components */}
      {/* <div className="p-2 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
        <span>{`Book ${currentIndex + 1} of ${books.length}`}</span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm">{currentBook.concept_genre || "Unknown"}</span>
      </div> */}


      <div className="grid grid-cols-3 justify-items-center items-center w-full">
        {/* <div className="w-full max-w-4xl rounded-3xl border border-gray-200 bg-white/95 p-8 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-0.5"> */}

        {/* <div className="mb-6 flex flex-col gap-2 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">Vote on Concepts</h1>
          </div> */}


        <div className="flex justify-center gap-4">
          <Button
            onClick={() => handleChoice("no")}
            variant="destructive"
            className="rounded-full py-4 text-lg font-semibold"
          >
            No
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
            <p className="mt-2 text-gray-600">You’ve finished voting on the current queue.</p>
            <Button variant="secondary" className="mt-6 px-8 py-3" onClick={restartSwipe}>Restart voting</Button>
          </div>
        ) : (
          <>
            {/* Place BookCard */}
            <BookCard
              key={currentBook.tournamentsub_id}
              title={currentBook.concept_title}
              description={currentBook.concept_description}
              genre={currentBook.concept_genre}
              tournamentsub_id={currentBook.tournamentsub_id}
              styling={currentBook.concept_styling}
              isLiked={currentBook.isLiked}
            />


            {/* Needs to go somewhere */}
            {/* <p className="mt-4 text-base leading-7 text-slate-700">{currentBook.concept_description || "No description available."}</p> */}

            {/* <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Submitted by</p>
                <p className="mt-2 font-medium text-slate-900">{currentConcept.user_name || currentConcept.creator || "Anonymous"}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Submitted at</p>
                <p className="mt-2 font-medium text-slate-900">{currentConcept.created_at ? new Date(currentConcept.created_at).toLocaleDateString() : "Unknown"}</p>
                </div>
                </div>

            </div> */}
          </>
        )}


        <div className="mt-8 gap-4 flex justify-center">
          <Button
            onClick={() => handleChoice("yes")}
            variant="secondary"
            className="w-[40%] rounded-full font-semibold text-lg bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500"
          >
            Yes
          </Button>
        </div>


        {feedback && (
          <div className={`mt-6 rounded-3xl px-5 py-4 text-center text-sm font-semibold ${feedback === "yes" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
            {feedback === "yes" ? "Vote recorded: yes." : "Vote recorded: no."}
          </div>
        )}
      </div>
    </ div>
    // </div>
  );
};

export default SwipeViewPage