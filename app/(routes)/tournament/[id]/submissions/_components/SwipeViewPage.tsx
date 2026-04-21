"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const SwipeViewPage = () => {
  const [concepts, setConcepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    async function getConcepts() {
      const { data, error } = await supabase
        .from("concept")
        .select("*");

      if (error) {
        const message = error.message || JSON.stringify(error);
        console.error("Error fetching concept:", message);
        setLoading(false);
        return;
      }

      if (!data) {
        console.error("Error fetching concept: no data");
        setConcepts([]);
        setLoading(false);
        return;
      }

      setConcepts(data);
      setLoading(false);
    };

    getConcepts();
  }, []);

  const handleChoice = (choice: "yes" | "no") => {
    setFeedback(choice);
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, concepts.length));
    window.setTimeout(() => setFeedback(null), 900);
  };

  const restartSwipe = () => {
    setCurrentIndex(0);
    setFeedback(null);
  };

  if (loading) {
    return (
      <div className="flex w-full flex-col items-center mt-10">
        <p className="text-lg">Loading concepts...</p>
      </div>
    );
  }

  const currentConcept = concepts[currentIndex];
  const hasConcept = Boolean(currentConcept);

  return (
    <div className="flex w-full flex-col items-center mt-10 px-4">
      <div className="w-full max-w-4xl rounded-3xl border border-gray-200 bg-white/95 p-8 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-0.5">
        <div className="mb-6 flex flex-col gap-2 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">Vote on Concepts</h1>
        </div>

        {concepts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <p className="text-xl font-semibold">No concepts to vote on yet.</p>
            <p className="mt-2 text-gray-600">Check back when new submissions are available.</p>
          </div>
        ) : !hasConcept ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <p className="text-xl font-semibold">No more concepts to vote on right now.</p>
            <p className="mt-2 text-gray-600">You’ve finished voting on the current queue.</p>
            <Button variant="secondary" className="mt-6 px-8 py-3" onClick={restartSwipe}>Restart voting</Button>
          </div>
        ) : (
          <>
            <div className="rounded-[28px] border border-gray-200 bg-secondary/10 p-8 shadow-lg shadow-slate-200/30">
              <div className="mb-6 flex items-center justify-between gap-4 text-sm text-muted-foreground">
                <span>{`Concept ${currentIndex + 1} of ${concepts.length}`}</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-sm">{currentConcept.concept_genre || currentConcept.category || "Unknown"}</span>
              </div>

              <h2 className="text-3xl font-bold leading-tight">{currentConcept.concept_title || currentConcept.title || "Untitled Concept"}</h2>
              <p className="mt-4 text-base leading-7 text-slate-700">{currentConcept.concept_description || currentConcept.description || "No description available."}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Submitted by</p>
                  <p className="mt-2 font-medium text-slate-900">{currentConcept.user_name || currentConcept.creator || "Anonymous"}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Submitted at</p>
                  <p className="mt-2 font-medium text-slate-900">{currentConcept.created_at ? new Date(currentConcept.created_at).toLocaleDateString() : "Unknown"}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Button
                onClick={() => handleChoice("no")}
                variant="destructive"
                className="w-full rounded-full py-4 text-lg font-semibold"
              >
                No
              </Button>
              <Button
                onClick={() => handleChoice("yes")}
                variant="secondary"
                className="w-full rounded-full bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500"
              >
                Yes
              </Button>
            </div>

            {feedback && (
              <div className={`mt-6 rounded-3xl px-5 py-4 text-center text-sm font-semibold ${feedback === "yes" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {feedback === "yes" ? "Vote recorded: yes." : "Vote recorded: no."}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SwipeViewPage