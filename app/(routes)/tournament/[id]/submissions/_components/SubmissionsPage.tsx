"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useState } from "react";
import GridViewPage from "./GridViewPage";
import SwipeViewPage from "./SwipeViewPage";
import BookContext from "@/app/_context/book/BookContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

const SubmissionsPage = () => {
  const { isGridMode, setIsGridMode, books } = useContext(BookContext);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [showingLiked, setShowingLiked] = useState(false);
  const params = useParams<{ id: string }>();
  const id = params.id;

  const likedBooks = books.filter(book => book.isLiked);
  const hasLikedBooks = likedBooks.length > 0;

  const handleLikedToggle = useCallback(() => {
    setShowingLiked(prev => !prev)
  }, []);

  const handleModeToggle = useCallback(() => {
    setShowingLiked(false);
    setIsGridMode(!isGridMode);
  }, [isGridMode]);

  useEffect(() => {
    const fetchTournamentTitle = async () => {
      const { data, error } = await supabase
        .from("tournament")
        .select("tournament_title")
        .eq("tournament_id", id)
        .single();

      if (error) {
        console.warn("Error fetching tournament title: ", error);
        setTitle("Tournament Submissions");
      }

      if (data) setTitle(data.tournament_title);
    }
    if (id) fetchTournamentTitle();
  }, [id]);

  return (
    <div className="flex w-full flex-col items-center font-bold">

      <section className="mb-1 w-full">
        <div className="relative w-full flex justify-center items-center mb-8">
          {isGridMode ? (
            <Button className="absolute left-0 bg-white hover:bg-slate-100 text-sm font-medium text-slate-700" onClick={() => { router.push("./") }}>
              ← Back to Tournament
            </Button>) : (<></>)
          }
          <h1 className="text-4xl font-headline font-bold tracking-tighter text-on-background">
            {title}
          </h1>
        </div>
      </section>

      <div className="flex w-full justify-between">
        {isGridMode ? (
          <button className="rounded-lg bg-primary p-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer" onClick={() => { router.push("/bookbuilder") }}>
            Submit a Book
          </button>
        ) : (
          hasLikedBooks && (
            <button
              className="rounded-lg bg-primary p-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer"
              onClick={handleLikedToggle}
            >
              {showingLiked ? "Browse Books" : `View Liked Books (${likedBooks.length})`}

            </button>
          )
        )
        }
        <div className="flex ml-auto">
          <button className="rounded-lg bg-primary p-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer" onClick={handleModeToggle}>
            {isGridMode ? "Swipe Mode" : "Grid Mode"}
          </button>
        </div>


      </div>
      {isGridMode ? (
        <GridViewPage />
      ) : (
        <SwipeViewPage showingLiked={showingLiked} onLikedToggle={handleLikedToggle} />
      )}
    </div>
  )
};

export default SubmissionsPage;