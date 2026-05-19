"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Concept } from "@/app/_types/model/Concept";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
};

type Tournament = {
  tournament_title: string;
  tournament_end_date: string;
};

const OneVsOnePage = ({ tournamentId, bmatchId }: Props) => {
  const router = useRouter();

  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<"a" | "b" | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);


  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [hasVoted, setHasVoted] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<"a" | "b" | null>(null);

  const [book1Flipped, setBook1Flipped] = useState(false);
  const [book2Flipped, setBook2Flipped] = useState(false);



  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracket, setBracket] = useState<Bracket | null>(null);

  const [book1, setBook1] = useState<Concept | null>(null);
  const [book2, setBook2] = useState<Concept | null>(null);
  const [submissionAId, setSubmissionAId] = useState<string | null>(null);
  const [submissionBId, setSubmissionBId] = useState<string | null>(null);

  const submissionAIdRef = useRef<string | null>(null);
  const submissionBIdRef = useRef<string | null>(null);


  const [loading, setLoading] = useState(true);


  useEffect(() => {

    const fetchMatchup = async () => {
      setLoading(true);
      try {
        // 1. Fetch the match
        const { data: match, error: matchError } = await supabase
          .from("bracket_match")
          .select("*")
          .eq("bmatch_id", bmatchId)
          .single();

        if (matchError) throw matchError;

        // 2. Fetch the bracket and validate tournament_id matches the URL
        const { data: bracketData, error: bracketError } = await supabase
          .from("bracket")
          .select("bracket_round_number, tournament_id")
          .eq("bracket_id", match.bracket_id)
          .single();

        if (bracketError) throw bracketError;

        if (String(bracketData.tournament_id) !== String(tournamentId)) {
          router.push(`/tournament/${tournamentId}/tournamentbracket`);
          return;
        }

        setBracket(bracketData);

        // 3. Fetch tournament data
        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournament")
          .select("tournament_title, tournament_end_date")
          .eq("tournament_id", bracketData.tournament_id)
          .single();

        if (tournamentError) throw tournamentError;
        setTournament(tournamentData);

        // 4. Fetch submissions
        const { data: submissions, error: subError } = await supabase
          .from("tournament_submission")
          .select("tournamentsub_id, concept_id")
          .in("tournamentsub_id", [
            match.bmatch_submission_a,
            match.bmatch_submission_b,
          ]);

        if (subError) throw subError;

        const conceptIds = submissions.map((sub) => sub.concept_id);

        // 5. Fetch concepts
        const { data: concepts, error: conceptError } = await supabase
          .from("concept")
          .select("*")
          .in("concept_id", conceptIds);

        if (conceptError) throw conceptError;

        console.log("submissions returned:", submissions);
        console.log("match submission_a:", match.bmatch_submission_a, typeof match.bmatch_submission_a);
        console.log("match submission_b:", match.bmatch_submission_b, typeof match.bmatch_submission_b);


        const subA = submissions.find(
          (sub) => sub.tournamentsub_id === match.bmatch_submission_a
        );
        const subB = submissions.find(
          (sub) => sub.tournamentsub_id === match.bmatch_submission_b
        );


        console.log("subA:", subA);
        console.log("subB:", subB);

        const bookA = concepts.find(
          (concept) => concept.concept_id === subA?.concept_id
        );
        const bookB = concepts.find(
          (concept) => concept.concept_id === subB?.concept_id
        );

        setBook1(bookA ?? null);
        setBook2(bookB ?? null);
        setSubmissionAId(subA?.tournamentsub_id ?? null);
        setSubmissionBId(subB?.tournamentsub_id ?? null);

        submissionAIdRef.current = subA?.tournamentsub_id ?? null;  // ← add
        submissionBIdRef.current = subB?.tournamentsub_id ?? null;  // ← add  

      } catch (error) {
        console.error("Fetch matchup failed:", error);
        router.push(`/tournament/${tournamentId}/tournamentbracket`);
      } finally {
        setLoading(false);
      }
    };


    fetchMatchup();
  }, [bmatchId, tournamentId]);



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
          setHasVoted(book1?.concept_title ?? null);
        } else if (vote.tournamentsub_id === submissionBId) {
          setUserVote("b");
          setHasVoted(book2?.concept_title ?? null);
        }
      }
    };

    loadExistingVote();
  }, [submissionAId, submissionBId, bmatchId, book1, book2]);
  //________________helpers________________________________________________________


  const calculateTimeLeft = (endDate: string) => {
    const difference = new Date(endDate).getTime() - new Date().getTime();

    if (difference <= 0) return "Voting ended";

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / (1000 * 60)) % 60);

    return `${days}d ${hours}h ${minutes}m`;
  };



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

    setIsSubmittingVote(true);


    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      setIsSubmittingVote(false);
      return;
    }

    const newSubmissionId =
      selectedSide === "a" ? submissionAIdRef.current : submissionBIdRef.current;

    if (!newSubmissionId) {
      console.error("Submission ID missing");
      setIsSubmittingVote(false);
      return;
    }


    try {
      if (userVote) {
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
      }

      setUserVote(selectedSide);
      setHasVoted(selectedBook);
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
        <Button className="bg-white hover:bg-slate-100 text-sm font-medium text-slate-700 pb-3" onClick={() => { router.push("./") }}>
          ← Back to Bracket
        </Button>

        <div className="flex justify-between items-start">
          <h1 className=" md:text-5xl font-headline font-bold text-on-surface tracking-tighter pt-3 ">
            {tournament?.tournament_title}</h1>

          <div className="rounded-full bg-green-100 px-5 py-3 text-sm font-semibold text-blue-800 shadow-lg mb-3 ">
            Voting Ends in {tournament ? calculateTimeLeft(tournament.tournament_end_date) : "..."}
          </div>
        </div>
        <p className="mb-2 max-w-4xl text-base font-bold text-gray-500 sm:text-xl pt-3">Round: {bracket?.bracket_round_number} One vs One</p>

        {/* Book section */}



        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 mt-6 items-center justify-items-center">
          {/* book 1 item */}

          <div className="perspective-[1000px] w-[400px]">
            <div
              className={`relative h-[460px] w-full transition-transform duration-500 [transform-style:preserve-3d] ${book1Flipped ? "[transform:rotateY(180deg)]" : "hover:-translate-y-3"}`}
            >

              {/* Front */}
              <div
                className="absolute inset-0 overflow-hidden rounded-[1.75rem] p-4 bg-purple-100  hover:bg-purple-200 shadow-md flex flex-col [backface-visibility:hidden]"
              >
                <img
                  src={supabase.storage
                    .from("book-covers")
                    .getPublicUrl(book1.concept_styling.book_cover)
                    .data.publicUrl}
                  alt={book1.concept_title}
                  className="w-full flex-1 min-h-0 rounded-[1.75rem] shadow-md cursor-pointer"
                  onClick={() => setBook1Flipped(!book1Flipped)}
                />


                <div className="mt-5 flex justify-center">
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
              className={`relative h-[460px] w-full transition-transform duration-500 [transform-style:preserve-3d] ${book2Flipped ? "[transform:rotateY(180deg)]" : "hover:-translate-y-3"}`}
            >

              {/* Front */}

              <div
                className="absolute inset-0 overflow-hidden rounded-[1.75rem] p-4 bg-purple-100 hover:bg-purple-200 shadow-md flex flex-col [backface-visibility:hidden]"
              >
                <img
                  src={supabase.storage
                    .from("book-covers")
                    .getPublicUrl(book2.concept_styling.book_cover)
                    .data.publicUrl}

                  alt={book2.concept_title}
                  className="w-full flex-1 min-h-0 rounded-[1.75rem] shadow-md cursor-pointer"
                  onClick={() => setBook2Flipped(!book2Flipped)}
                />

                <div className="mt-5 flex justify-center">
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
                  {userVote && userVote !== selectedSide
                    ? `Switch your vote to ${selectedBook}?`
                    : `Vote for ${selectedBook}?`}
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