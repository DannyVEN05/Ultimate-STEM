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
  const [tournamentStatus, setTournamentStatus] = useState<string | null>(null);
  const [showingLiked, setShowingLiked] = useState(false);
  const [loading, setLoading] = useState(true);
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
        .select("tournament_title, tournament_status")
        .eq("tournament_id", id)
        .single();

      if (error) {
        console.warn("Error fetching tournament title: ", error);
        setTitle("Tournament Submissions");
      }
      setLoading(false);
      if (data) {
        setTitle(data.tournament_title);
        if (data.tournament_status) setTournamentStatus(data.tournament_status);
      }
    }
    if (id) fetchTournamentTitle();
  }, [id]);

  if (loading) return <p>Loading submissions...</p>

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
          // Only show submit button when tournament is in stage1
          tournamentStatus === "stage1" ? (
            <button className="rounded-lg bg-primary p-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer" onClick={() => { router.push(`/bookbuilder${id ? `?tournamentId=${encodeURIComponent(id)}` : ''}`) }}>
              Submit a Book
            </button>
          ) : null
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
        <GridViewPage canLike={tournamentStatus === "stage1"} />
      ) : (
        <SwipeViewPage showingLiked={showingLiked} onLikedToggle={handleLikedToggle} canLike={tournamentStatus === "stage1"} />
      )}
    </div>
  )
};

export default SubmissionsPage;