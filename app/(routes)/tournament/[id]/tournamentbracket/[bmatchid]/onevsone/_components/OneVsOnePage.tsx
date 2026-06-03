"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Concept } from "@/app/_types/model/Concept";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  formatCountdownParts,
  getCountdownParts,
  getRoundCountdownTarget,
  getTournamentMilestoneTarget,
  resolveTournamentLifecycleStatus,
  TournamentLifecycleStatus,
} from "@/app/_utilities/tournamentLifecycle";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";



type Props = {
  tournamentId: string;
  bmatchId: string;
};

type Bracket = {
  bracket_round_number: number;
  bracket_status?: string;
};

type Tournament = {
  tournament_title: string;
  tournament_start_date: string;
  tournament_s2_start_date: string | null;
  tournament_end_date: string;
  tournament_status: string;
};

const OneVsOnePage = ({ tournamentId, bmatchId }: Props) => {
  const router = useRouter();

  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<"a" | "b" | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);


  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [userVote, setUserVote] = useState<"a" | "b" | null>(null);

  const [book1Flipped, setBook1Flipped] = useState(false);
  const [book2Flipped, setBook2Flipped] = useState(false);



  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tournamentStatus, setTournamentStatus] = useState<string | null>(null);
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [totalRounds, setTotalRounds] = useState(1);
  const [activeRound, setActiveRound] = useState(1);

  const [book1, setBook1] = useState<Concept | null>(null);
  const [book2, setBook2] = useState<Concept | null>(null);
  const [submissionAId, setSubmissionAId] = useState<string | null>(null);
  const [submissionBId, setSubmissionBId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const hasVoted = userVote === "a" ? book1?.concept_title : userVote === "b" ? book2?.concept_title : null;

  const fetchMatchup = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      try {
        await supabase.rpc("advance_tournament_lifecycle", { p_tournament_id: Number(tournamentId) });
      } catch (e) {
        console.warn("Lifecycle update check failed:", e);
      }

      const { data: match, error: matchError } = await supabase
        .from("bracket_match")
        .select("*")
        .eq("bmatch_id", bmatchId)
        .single();

      if (matchError) throw matchError;

      const { data: bracketData, error: bracketError } = await supabase
        .from("bracket")
        .select("bracket_id, bracket_round_number, tournament_id, bracket_status")
        .eq("bracket_id", match.bracket_id)
        .single();

      if (bracketError) throw bracketError;

      if (String(bracketData.tournament_id) !== String(tournamentId)) {
        router.push(`/tournament/${tournamentId}/tournamentbracket`);
        return;
      }

      setBracket(bracketData);

      const { data: bracketMatches, error: matchesError } = await supabase
        .from("bracket_match")
        .select("bmatch_index")
        .eq("bracket_id", bracketData.bracket_id);

      const r1Count = (bracketMatches ?? []).filter(
        (m: any) => (m.bmatch_index?.round ?? 1) === 1
      ).length;
      const computedTotalRounds = Math.max(1, Math.ceil(Math.log2(r1Count * 2)));
      const computedActiveRound = bracketData.bracket_round_number ?? 1;

      setTotalRounds(computedTotalRounds);
      setActiveRound(computedActiveRound);

      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournament")
        .select("tournament_title, tournament_start_date, tournament_s2_start_date, tournament_end_date, tournament_status")
        .eq("tournament_id", bracketData.tournament_id)
        .single();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);
      if (tournamentData?.tournament_status) setTournamentStatus(tournamentData.tournament_status);

      const { data: submissions, error: subError } = await supabase
        .from("tournament_submission")
        .select("tournamentsub_id, concept_id")
        .in("tournamentsub_id", [match.bmatch_submission_a, match.bmatch_submission_b])
        .not("tournamentsub_status", "eq", "deleted");

      if (subError) throw subError;

      const conceptIds = submissions.map((sub) => sub.concept_id);

      const { data: concepts, error: conceptError } = await supabase
        .from("concept")
        .select("*")
        .in("concept_id", conceptIds)
        .not("concept_status", "eq", "deleted");

      if (conceptError) throw conceptError;

      const subA = submissions.find((sub) => sub.tournamentsub_id === match.bmatch_submission_a);
      const subB = submissions.find((sub) => sub.tournamentsub_id === match.bmatch_submission_b);

      const bookA = concepts.find((concept) => concept.concept_id === subA?.concept_id);
      const bookB = concepts.find((concept) => concept.concept_id === subB?.concept_id);

      setBook1(bookA ?? null);
      setBook2(bookB ?? null);
      setSubmissionAId(subA?.tournamentsub_id ?? null);
      setSubmissionBId(subB?.tournamentsub_id ?? null);
    } catch (error) {
      console.error("Fetch matchup failed:", error);
      router.push(`/tournament/${tournamentId}/tournamentbracket`);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [bmatchId, tournamentId, router]);

  useEffect(() => {
    fetchMatchup();
  }, [fetchMatchup]);

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!tournament) return;

    const timerId = window.setInterval(() => {
      fetchMatchup(true);
    }, 30000);

    return () => window.clearInterval(timerId);
  }, [fetchMatchup, tournament]);



  useEffect(() => {
    if (!submissionAId || !submissionBId) return;

    const loadExistingVote = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: vote, error } = await supabase
        .from("vote")
        .select("tournamentsub_id")
        .eq("bmatch_id", bmatchId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load existing vote:", error);
        return;
      }

      if (vote) {
        if (vote.tournamentsub_id === submissionAId) {
          setUserVote("a");

        } else if (vote.tournamentsub_id === submissionBId) {
          setUserVote("b");
        }
      }
    };

    loadExistingVote();
  }, [submissionAId, submissionBId, bmatchId]);
  //________________helpers________________________________________________________

  const resolvedStatus = useMemo<TournamentLifecycleStatus>(() => {
    return resolveTournamentLifecycleStatus(tournament, now);
  }, [now, tournament]);

  const totalCountdown = useMemo(() => {
    return getCountdownParts(
      tournament?.tournament_end_date ? new Date(tournament.tournament_end_date).getTime() : null,
      now,
    );
  }, [now, tournament?.tournament_end_date]);

  const milestone = useMemo(() => {
    return getTournamentMilestoneTarget(tournament, resolvedStatus);
  }, [resolvedStatus, tournament]);

  const milestoneCountdown = useMemo(() => {
    return getCountdownParts(milestone.targetMs, now);
  }, [milestone.targetMs, now]);

  const roundCountdownTarget = useMemo(() => {
    return getRoundCountdownTarget(tournament, totalRounds, activeRound);
  }, [activeRound, totalRounds, tournament]);

  const roundCountdown = useMemo(() => {
    return getCountdownParts(roundCountdownTarget, now);
  }, [now, roundCountdownTarget]);



  //_______________handle voting_________________________________

  const handleConfirmVote = async () => {
    if (!selectedSide) {
      console.error("No selected side");
      return;
    }


    if (userVote === selectedSide) {
      setIsVoting(false);
      return;
    }

    // Prevent voting unless the tournament is in stage2
    if (resolvedStatus !== "stage2") {
      alert("Voting is not open for this tournament.");
      setIsVoting(false);
      return;
    }

    setIsSubmittingVote(true);


    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      setIsSubmittingVote(false);
      return;
    }

    const newSubmissionId =
      selectedSide === "a" ? submissionAId : submissionBId;

    if (!newSubmissionId) {
      console.error("Submission ID missing");
      setIsSubmittingVote(false);
      return;
    }


    try {

      // ── UPDATE existing vote row ──────────────────────────────────────
      const { error } = await supabase
        .from("vote")
        .upsert({
          bmatch_id: bmatchId,
          user_id: user.id,
          tournamentsub_id: newSubmissionId,
        }, {
          onConflict: "bmatch_id,user_id"
        });

      if (error) throw error;

      setUserVote(selectedSide);

      setVoteSuccess(true);
      setTimeout(() => {
        setVoteSuccess(false);
        setIsVoting(false);
      }, 3000);


    } catch (err) {
      console.error("vote failed", err);
    } finally {
      setIsVoting(false);
      setIsSubmittingVote(false);
    }
  };


  if (loading) return <p>Loading matchup...</p>;
  if (!book1 || !book2) return <p>No matchup found.</p>;

  return (

    <div className="mx-auto max-w-7xl ">
      <div className="pointer-events-none absolute top-16 left-0 h-[400px] w-[500px] bg-[radial-gradient(circle_at_top_left,_rgba(0,255,0,0.2),_transparent_50%)]" />



      <div className="bg-white px-4 pt-1">
        <Button className="bg-white hover:bg-slate-100 text-sm font-medium text-slate-700 pb-3" onClick={() => { router.push(`/tournament/${tournamentId}/tournamentbracket`) }}>
          ← Back to Bracket
        </Button>

        <div className="flex justify-between items-start">
          <h1 className=" md:text-5xl font-headline font-bold text-on-surface tracking-tighter pt-3 ">
            {tournament?.tournament_title}</h1>

          <div className={`rounded-full px-5 py-3 text-sm font-semibold shadow-lg mb-3 ${resolvedStatus === "stage2" ? "bg-green-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}>
            {resolvedStatus === "stage2"
              ? `Voting ends in ${formatCountdownParts(totalCountdown)}`
              : resolvedStatus === "stage1"
                ? `Stage 2 starts in ${formatCountdownParts(milestoneCountdown)}`
                : resolvedStatus === "upcoming"
                  ? `Tournament starts in ${formatCountdownParts(milestoneCountdown)}`
                  : "Voting has ended"}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-bold text-purple-800">
            {resolvedStatus.charAt(0).toUpperCase() + resolvedStatus.slice(1)}
          </span>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            Round {activeRound} of {totalRounds}
          </span>
        </div>
        <p className="mb-2 max-w-4xl text-base font-bold text-gray-500 sm:text-xl pt-3">{bracket?.bracket_round_number} One vs One</p>

        {resolvedStatus !== "concluded" && resolvedStatus !== "terminated" && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-700">Tournament time remaining</p>
              <p className="mt-3 text-3xl font-extrabold text-purple-900">{formatCountdownParts(totalCountdown)}</p>
            </div>

            {resolvedStatus === "stage2" && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Current round time remaining</p>
                <p className="mt-3 text-3xl font-extrabold text-emerald-900">{formatCountdownParts(roundCountdown)}</p>
              </div>
            )}
          </div>
        )}

        {/* Book section */}



        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 mt-6 items-center justify-items-center">
          {/* book 1 item */}

          <div className="perspective-[1000px] w-[400px]">
            <div
              className={`relative aspect-[3/4] w-full transition-transform duration-500 [transform-style:preserve-3d] ${book1Flipped ? "[transform:rotateY(180deg)]" : "hover:-translate-y-3"}`}
            >

              {/* Front */}
              <div
                className="absolute inset-0 overflow-hidden rounded-lg p-4 bg-purple-100  hover:bg-purple-200 shadow-md flex flex-col [backface-visibility:hidden]"
              >
                <img
                  src={book1.concept_styling?.book_cover
                    ? supabase.storage
                      .from("book-covers")
                      .getPublicUrl(book1.concept_styling.book_cover)
                      .data.publicUrl
                    : "/placeholder-cover.png"
                  }

                  alt={book1.concept_title}
                  className="w-full flex-1 min-h-0 rounded-lg shadow-md cursor-pointer aspect-[3/4]"
                  onClick={() => setBook1Flipped(!book1Flipped)}
                />


                <div className="mt-5 flex justify-center">
                  {resolvedStatus === "stage2" && (
                    <Button
                      className="pointer-events-auto bg-green-300 hover:bg-green-400 text-gray-700 px-10 py-5.5 text-lg rounded-[1.75rem] shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBook(book1.concept_title);
                        setSelectedSide("a")
                        setIsVoting(true);
                      }}
                    >
                      Vote
                    </Button>
                  )}
                </div>
              </div>

              {/* Back */}
              <div
                onClick={() => setBook1Flipped(!book1Flipped)}
                className="absolute inset-0 overflow-hidden rounded-[1.75rem] p-6 bg-purple-100 cursor-pointer hover:bg-purple-200 shadow-md flex flex-col [transform:rotateY(180deg)] [backface-visibility:hidden]"
              >
                <h2 className="text-2xl font-bold text-gray-800">
                  {book1.concept_title}
                </h2>

                <p className="text-base text-gray-700 leading-relaxed overflow-y-auto">
                  {book1.concept_description}
                </p>

              </div>
            </div>
          </div>

          {/* end of book1 item */}


          <div className="flex items-center justify-center">
            <div className="rounded-full bg-white border border-purple-300 border-4 px-5 py-4 text-lg font-bold text-gray-800 shadow-lg">
              VS
            </div>
          </div>

          {/* Book 2 item */}

          <div className="perspective-[1000px] w-[400px]">
            <div
              className={`relative aspect-[3/4] w-full transition-transform duration-500 [transform-style:preserve-3d] ${book2Flipped ? "[transform:rotateY(180deg)]" : "hover:-translate-y-3"}`}
            >

              {/* Front */}

              <div
                className="absolute inset-0 overflow-hidden rounded-lg p-4 bg-purple-100 hover:bg-purple-200 shadow-md flex flex-col [backface-visibility:hidden]"
              >
                <img
                  src={book2.concept_styling?.book_cover
                    ? supabase.storage
                      .from("book-covers")
                      .getPublicUrl(book2.concept_styling.book_cover)
                      .data.publicUrl
                    : "/placeholder-cover.png"
                  }

                  alt={book2.concept_title}
                  className="w-full flex-1 min-h-0 rounded-lg shadow-md cursor-pointer aspect-[3/4]"
                  onClick={() => setBook2Flipped(!book2Flipped)}
                />

                <div className="mt-5 flex justify-center">
                  {resolvedStatus === "stage2" && (
                    <Button
                      className=" pointer-events-auto bg-green-300 hover:bg-green-400 text-gray-700 px-10 py-5.5 text-lg rounded-[1.75rem] shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBook(book2.concept_title);
                        setSelectedSide("b");
                        setIsVoting(true);
                      }}
                    >
                      Vote
                    </Button>
                  )}

                </div>
              </div>

              {/* Back */}
              <div
                onClick={() => setBook2Flipped(!book2Flipped)}
                className="absolute inset-0 overflow-hidden rounded-[1.75rem] p-6 bg-purple-100 cursor-pointer hover:bg-purple-200 shadow-md flex flex-col [transform:rotateY(180deg)] [backface-visibility:hidden]"
              >

                <h2 className="text-2xl font-bold text-gray-800">
                  {book2.concept_title}
                </h2>

                <p className="text-base text-gray-700 leading-relaxed overflow-y-auto">
                  {book2.concept_description}
                </p>

              </div>
            </div>
          </div>

          {/* dialog for voting */}
          <Dialog open={isVoting} onOpenChange={setIsVoting}>
            <DialogContent className="max-w-sm rounded-2xl">

              <DialogHeader>
                <DialogTitle className="text-[#1d2436]">Confirm Your Vote</DialogTitle>
                <DialogDescription className="text-[#8088a0]">
                  {userVote === selectedSide
                    ? `You have already voted for ${selectedBook}.`
                    : userVote && userVote !== selectedSide
                      ? `Would you like to switch your vote to ${selectedBook}?`
                      : `Would you like to vote for ${selectedBook}?`}

                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button onClick={() => setIsVoting(false)} disabled={isSubmittingVote}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmVote} disabled={isSubmittingVote}>
                  {isSubmittingVote ? "Submitting..." : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {voteSuccess && (
            <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50">
              <Alert className="border-green-200 bg-green-100 shadow-lg px-6 py-4 w-fit">
                <AlertDescription className="text-green-800 font-medium">
                  ✓ Your vote for <span className="font-bold">{hasVoted}</span> has been submitted!
                </AlertDescription>
              </Alert>
            </div>
          )}

        </div>
      </div>
    </div>

  );
};

export default OneVsOnePage;