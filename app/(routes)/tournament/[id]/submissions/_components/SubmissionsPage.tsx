"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useState } from "react";
import GridViewPage from "./GridViewPage";
import SwipeViewPage from "./SwipeViewPage";
import BookContext from "@/app/_context/book/BookContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

const SubmissionsPage = () => {
  const { isGridMode, setIsGridMode, books, setBooks } = useContext(BookContext);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tournamentStatus, setTournamentStatus] = useState<string | null>(null);
  const [showingLiked, setShowingLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);
  const params = useParams<{ id: string }>();
  const id = params.id;

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile, error } = await supabase
          .from("user")
          .select("user_role")
          .eq("user_id", user.id)
          .single();
        if (!error && profile && profile.user_role === "admin") {
          setIsAdmin(true);
        }
      } catch (e) {
        console.warn("Admin check failed:", e);
      }
    })();
  }, []);

  const handleAddAllConcepts = async () => {
    if (bulkAdding) return;
    setBulkAdding(true);
    try {
      const { data: tournament, error: tErr } = await supabase
        .from("tournament")
        .select("tournament_user_limit")
        .eq("tournament_id", id)
        .single();

      if (tErr || !tournament) {
        alert("Failed to fetch tournament limit details.");
        return;
      }

      const limit = Number(tournament.tournament_user_limit ?? 0);

      const { count, error: countErr } = await supabase
        .from("tournament_submission")
        .select("*", { count: "exact", head: true })
        .eq("tournament_id", id);

      if (countErr) {
        alert("Failed to check current submissions count.");
        return;
      }

      const currentCount = count ?? 0;
      const slotsRemaining = limit - currentCount;

      if (slotsRemaining <= 0) {
        alert(`The tournament has already reached its submission limit of ${limit}.`);
        return;
      }

      const { data: existingSubs, error: subsErr } = await supabase
        .from("tournament_submission")
        .select("concept_id")
        .eq("tournament_id", id);

      if (subsErr) {
        alert("Failed to fetch existing tournament submissions.");
        return;
      }

      const existingConceptIds = existingSubs?.map(s => s.concept_id) ?? [];

      const { data: allConcepts, error: conceptsErr } = await supabase
        .from("concept")
        .select("concept_id")
        .not("concept_status", "eq", "deleted");

      if (conceptsErr) {
        alert("Failed to fetch concepts from database.");
        return;
      }

      const availableConcepts = (allConcepts ?? []).filter(
        c => !existingConceptIds.includes(c.concept_id)
      );

      if (availableConcepts.length === 0) {
        alert("No new concepts available in the database to add.");
        return;
      }

      const toAdd = availableConcepts.slice(0, slotsRemaining);

      const rowsToInsert = toAdd.map(c => ({
        tournament_id: Number(id),
        concept_id: c.concept_id,
        tournamentsub_status: "approved"
      }));

      const { error: insertErr } = await supabase
        .from("tournament_submission")
        .insert(rowsToInsert);

      if (insertErr) {
        alert("Failed to insert concept submissions: " + insertErr.message);
        return;
      }

      alert(`Successfully added and approved ${toAdd.length} concepts to the tournament!`);
      await setBooks(String(id));

    } catch (err) {
      console.error("Bulk add concepts failed:", err);
      alert("An unexpected error occurred during bulk add.");
    } finally {
      setBulkAdding(false);
    }
  };

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
        <div className="flex ml-auto items-center">
          {isAdmin && tournamentStatus === "stage1" && (
            <button
              className="rounded-lg bg-purple-700 p-2 text-sm font-semibold text-white hover:bg-purple-800 transition-colors cursor-pointer mr-2"
              onClick={handleAddAllConcepts}
              disabled={bulkAdding}
            >
              {bulkAdding ? "Adding Concepts..." : "Add & Approve All Concepts"}
            </button>
          )}
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