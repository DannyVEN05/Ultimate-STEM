"use client";

import { Concept } from "@/app/_types/model/Concept";
import { supabase } from "@/lib/supabase";
import { useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import BookContext from "@/app/_context/book/BookContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Props = {
  className?: string;
  concept: Concept;
}

const ProfileBookCard: React.FC<Props> = ({
  className = "",
  concept
}) => {

  const fallbackCoverUrl = '/covers/engineering.png';
  const bookCover = concept.concept_styling.book_cover;
  let coverUrl = fallbackCoverUrl;
  if (bookCover) {
    const isLocalPath = bookCover.startsWith('/');
    const isAbsoluteUrl = /^(https?:)?\/\//.test(bookCover);
    if (isLocalPath || isAbsoluteUrl) {
      coverUrl = bookCover;
    } else {
      const { data } = supabase.storage.from('book-covers').getPublicUrl(bookCover);
      coverUrl = data?.publicUrl ?? fallbackCoverUrl;
    }
  };

  return (
    <ManageCard concept={concept} className={className} coverUrl={coverUrl} />
  )
};

const ManageCard: React.FC<{ concept: Concept; className?: string; coverUrl: string }> = ({ concept, className = "", coverUrl }) => {
  const [open, setOpen] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { setUserConcepts } = useContext(BookContext);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: tData, error: tError } = await supabase
        .from("tournament")
        .select("tournament_id, tournament_title, tournament_status")
        .in("tournament_status", ["stage1", "stage2"])
        .order("tournament_start_date", { ascending: false });

      if (tError) {
        console.warn("Error fetching tournaments:", tError);
      }

      const { data: sData, error: sError } = await supabase
        .from("tournament_submission")
        .select("*")
        .eq("concept_id", concept.concept_id)
        .not("tournamentsub_status", "eq", "deleted");

      if (sError) console.warn("Error fetching submissions:", sError);

      setTournaments(tData ?? []);
      setSubs(sData ?? []);
    } catch (err) {
      console.warn("Error loading manage widget:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleAdd = async (tournamentId: number) => {
    try {
      const { error } = await supabase.from("tournament_submission").insert({ concept_id: concept.concept_id, tournament_id: tournamentId });
      if (error) {
        alert(`Failed to add to tournament: ${error.message}`);
        return;
      }

      // refresh submissions list
      const { data: sData } = await supabase
        .from("tournament_submission")
        .select("*")
        .eq("concept_id", concept.concept_id)
        .not("tournamentsub_status", "eq", "deleted");
      setSubs(sData ?? []);
    } catch (err) {
      console.error(err);
      alert("Failed to add to tournament.");
    }
  };

  const handleRemove = async (submissionId: string) => {
    const ok = window.confirm("Removing this submission will delete all its current likes. Are you sure?");
    if (!ok) return;

    try {
      const { error } = await supabase
        .from("tournament_submission")
        .update({ tournamentsub_status: "deleted", tournamentsub_updated_at: new Date().toISOString() })
        .eq("tournamentsub_id", submissionId);

      if (error) {
        alert(`Failed to remove submission: ${error.message}`);
        return;
      }

      setSubs((prev) => prev.filter((s) => s.tournamentsub_id !== submissionId));
    } catch (err) {
      console.error(err);
      alert("Failed to remove submission.");
    }
  };

  const handleDeleteConcept = async () => {
    const ok = window.confirm("Permanently delete this book concept? This cannot be undone.");
    if (!ok) return;

    try {
      // mark concept as deleted
      const { error: cErr } = await supabase
        .from("concept")
        .update({ concept_status: "deleted", concept_updated_at: new Date().toISOString() })
        .eq("concept_id", concept.concept_id);

      if (cErr) {
        alert(`Failed to delete concept: ${cErr.message}`);
        return;
      }

      // mark any tournament submissions for this concept as deleted
      await supabase
        .from("tournament_submission")
        .update({ tournamentsub_status: "deleted", tournamentsub_updated_at: new Date().toISOString() })
        .eq("concept_id", concept.concept_id)
        .not("tournamentsub_status", "eq", "deleted");

      // close and refresh user concepts
      setOpen(false);
      if (setUserConcepts) setUserConcepts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete concept.");
    }
  };

  return (
    <div className={`relative w-full shadow-md border border-gray-200 rounded-lg p-4 hover:shadow-xl transition-all hover:bg-secondary/30 ${className}`}>
      <button
        type="button"
        aria-label="Settings"
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow-md hover:bg-primary/90 hover:text-white transition-all cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </button>

      <div className="w-[40%] bg-white shadow-md border border-gray-200 rounded-lg hover:shadow-xl transform transition hover:-translate-y-1 aspect-[3/4] overflow-hidden">
        <img src={coverUrl} alt={`${concept.concept_title} Book Cover`} className="h-full w-full object-cover rounded-lg" />
      </div>

      <div className="absolute top-4 bottom-4 right-4" style={{ left: 'calc(40% + 2rem)' }}>
        <div className="h-full flex flex-col gap-2 overflow-hidden">
          <div className="overflow-y-auto max-h-14 pr-12">
            <h3 className="text-xl font-bold">{concept.concept_title}</h3>
          </div>
          <div>
            <p className="text-md text-muted-foreground"><strong>Genre:</strong> {concept.concept_genre}</p>
          </div>
          <p className="text-md text-muted-foreground -mb-2"><strong>Description:</strong></p>
          <div className="overflow-y-auto flex-1 min-h-0">
            <p className="text-md text-muted-foreground">{concept.concept_description}</p>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { /* closed */ } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage "{concept.concept_title}"</DialogTitle>
            <DialogDescription>Manage the tournaments that this concept is submitted to.</DialogDescription>
          </DialogHeader>

          <div className="p-4">
            <h4 className="font-semibold mb-2">Active Tournaments</h4>
            <div className="space-y-3">
              {tournaments.length === 0 ? <p className="text-sm text-muted-foreground">No active tournaments at the moment.</p> : (
                tournaments.map((t) => {
                  const submission = subs.find((s) => String(s.tournament_id) === String(t.tournament_id));
                  const submitted = !!submission;
                  const submissionStatus = submission ? (submission.tournamentsub_status === 'approved' ? 'Approved' : 'Awaiting approval') : 'No submission';
                  return (
                    <div key={t.tournament_id} className="flex items-center justify-between gap-4 p-3 border rounded-md">
                      <div>
                        <div className="font-semibold">{t.tournament_title}</div>
                        <div className="text-sm text-muted-foreground">Tournament Status: {t.tournament_status === "stage1" ? "Stage 1" : "Stage 2"}</div>
                        {submissionStatus && <div className="text-sm">Submission: {submissionStatus}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        {t.tournament_status === 'stage1' && !submitted && (
                          <Button onClick={() => handleAdd(t.tournament_id)}>Add to tournament</Button>
                        )}
                        {t.tournament_status === 'stage1' && submitted && (
                          <Button variant="destructive" onClick={() => handleRemove(submission.tournamentsub_id)}>Remove from tournament</Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 border-t p-4">
            <h4 className="font-semibold mb-2">Danger zone</h4>
            <p className="text-sm text-muted-foreground mb-3">Permanently delete book concept. This cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDeleteConcept}>Permanently delete book concept</Button>
            </div>
          </div>

          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileBookCard;