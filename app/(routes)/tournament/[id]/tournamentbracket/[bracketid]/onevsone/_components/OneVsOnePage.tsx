"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Concept } from "@/app/_types/model/Concept";


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
  bracketId: string;
};

type Bracket = {
  bracket_round_number: number;
};

type Tournament = {
  tournament_title: string;
  tournament_end_date: string;
};

const OneVsOnePage = ({tournamentId,bracketId }: Props) => {
  const router = useRouter();

  const [selectedBook, setSelectedBook] = useState<string| null>(null);
  const [selectedSide, setSelectedSide] = useState<"a" | "b" | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [hasVoted, setHasVoted] = useState<string| null>(null);
  const [userVote, setUserVote] = useState<"a" | "b" | null>(null);


  const [book1Flipped, setBook1Flipped] = useState(false);
  const [book2Flipped, setBook2Flipped] = useState(false);

  

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracket, setBracket] = useState<Bracket | null>(null);

  const [book1, setBook1] = useState<Concept | null>(null);
  const [book2, setBook2] = useState<Concept | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {

    const fetchMatchup = async () => {
    setLoading(true);
    try {
      // 1. Fetch the match
      const { data: match, error: matchError } = await supabase
        .from("bracket_match")
        .select("*")
        .eq("bmatch_id", Number(bracketId))
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
          match.bmatch_concept_a,
          match.bmatch_concept_b,
        ]);

      if (subError) throw subError;

      const conceptIds = submissions.map((sub) => sub.concept_id);

      // 5. Fetch concepts
      const { data: concepts, error: conceptError } = await supabase
        .from("concept")
        .select("*")
        .in("concept_id", conceptIds);

      if (conceptError) throw conceptError;

      const subA = submissions.find(
        (sub) => sub.tournamentsub_id === match.bmatch_concept_a
      );
      const subB = submissions.find(
        (sub) => sub.tournamentsub_id === match.bmatch_concept_b
      );

      const bookA = concepts.find(
        (concept) => concept.concept_id === subA?.concept_id
      );
      const bookB = concepts.find(
        (concept) => concept.concept_id === subB?.concept_id
      );

      setBook1(bookA ?? null);
      setBook2(bookB ?? null);

    } catch (error) {
      console.error("Fetch matchup failed:", error);
      router.push(`/tournament/${tournamentId}/tournamentbracket`);
    } finally {
      setLoading(false);
    }
  };
     

    fetchMatchup();
  }, [bracketId, tournamentId]);




  const calculateTimeLeft = (endDate:string) => {
    const difference = new Date(endDate).getTime() - new Date().getTime();

    if (difference <= 0) return "Voting ended";
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / (1000 * 60)) % 60);

    return `${days}d ${hours}h ${minutes}m`;
  };

  
  if (loading) return <p>Loading matchup...</p>;
  if (!book1 || !book2) return <p>No matchup found.</p>;


 const handleConfirmVote = async () => {
  if (!selectedSide) {
    console.error("No selected side");
  return;
  }

  
  if (userVote === selectedSide) {
  setIsVoting(false);
  setIsSubmittingVote(false);
  return;
}

  setIsSubmittingVote(true);

  const voteColumn =
    selectedSide === "a"
      ? "bmatch_concept_a_votes"
      : "bmatch_concept_b_votes";

  const { data: match, error: fetchError } = await supabase
    .from("bracket_match")
    .select("bmatch_concept_a_votes, bmatch_concept_b_votes")
    .eq("bmatch_id", Number(bracketId))
    .single();

  if (fetchError || !match) {
    console.error(fetchError);
    setIsSubmittingVote(false);
    return;
  }


  let updates = {};

  if (selectedSide === "a") {
    updates = {
      bmatch_concept_a_votes:
        (match.bmatch_concept_a_votes ?? 0) + 1,

      bmatch_concept_b_votes:
        userVote === "b"
          ? Math.max((match.bmatch_concept_b_votes ?? 0) - 1, 0)
          : match.bmatch_concept_b_votes,
    };
  } else {
    updates = {
      bmatch_concept_b_votes:
        (match.bmatch_concept_b_votes ?? 0) + 1,

      bmatch_concept_a_votes:
        userVote === "a"
          ? Math.max((match.bmatch_concept_a_votes ?? 0) - 1, 0)
          : match.bmatch_concept_a_votes,
    };
}

  const {error: updateError } = await supabase
    .from("bracket_match")
    .update(updates)
    .eq("bmatch_id", Number(bracketId))
    .select();

  if (updateError) {
    console.error(updateError);
    setIsSubmittingVote(false);
    return;
  }

  setUserVote(selectedSide);
  setHasVoted(selectedBook);
  setIsVoting(false);
  setIsSubmittingVote(false);
}; 

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
                  Are you sure you want to vote for {selectedBook}?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  onClick={() => setIsVoting(false)}
                  disabled={isSubmittingVote}
                >
                  Cancel
                </Button>
                <Button
                    onClick={handleConfirmVote}
                    disabled={isSubmittingVote}
                >
                {isSubmittingVote ? "Submitting..." : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>

  );
};

export default OneVsOnePage;