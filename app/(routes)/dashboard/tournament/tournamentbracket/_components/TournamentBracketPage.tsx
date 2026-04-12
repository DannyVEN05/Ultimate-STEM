"use client";

import UsButton from "@/app/_common/ui/buttons/UsButton";
import { useRouter } from "next/navigation";
import { useContext, useMemo } from "react";
import { SingleEliminationBracket, Match, SVGViewer } from 'react-tournament-brackets';
import BookContext from "@/app/_context/book/BookContext";

const TournamentBracketPage = () => {
  const router = useRouter();
  const { books } = useContext(BookContext);

  const matches = useMemo(() => {
    // Take first 8 books as participants, or pad if less
    const participants = books.slice(0, 8).map(book => ({
      id: book.concept_id,
      name: book.concept_title,
    }));

    // For simplicity, assume 8 participants, create single elimination bracket
    // Round 1: 4 matches
    // Round 2: 2 matches
    // Round 3: 1 match

    const matchData = [
      // Round 1
      {
        id: 1,
        name: "Round 1 - Match 1",
        nextMatchId: 5,
        tournamentRoundText: "1",
        startTime: "",
        state: "DONE",
        participants: [
          { id: participants[0]?.id || "tbd", resultText: "WON", isWinner: true, status: "PLAYED", name: participants[0]?.name || "TBD" },
          { id: participants[1]?.id || "tbd", resultText: "LOST", isWinner: false, status: "PLAYED", name: participants[1]?.name || "TBD" },
        ],
      },
      {
        id: 2,
        name: "Round 1 - Match 2",
        nextMatchId: 5,
        tournamentRoundText: "1",
        startTime: "",
        state: "DONE",
        participants: [
          { id: participants[2]?.id || "tbd", resultText: "WON", isWinner: true, status: "PLAYED", name: participants[2]?.name || "TBD" },
          { id: participants[3]?.id || "tbd", resultText: "LOST", isWinner: false, status: "PLAYED", name: participants[3]?.name || "TBD" },
        ],
      },
      {
        id: 3,
        name: "Round 1 - Match 3",
        nextMatchId: 6,
        tournamentRoundText: "1",
        startTime: "",
        state: "DONE",
        participants: [
          { id: participants[4]?.id || "tbd", resultText: "WON", isWinner: true, status: "PLAYED", name: participants[4]?.name || "TBD" },
          { id: participants[5]?.id || "tbd", resultText: "LOST", isWinner: false, status: "PLAYED", name: participants[5]?.name || "TBD" },
        ],
      },
      {
        id: 4,
        name: "Round 1 - Match 4",
        nextMatchId: 6,
        tournamentRoundText: "1",
        startTime: "",
        state: "DONE",
        participants: [
          { id: participants[6]?.id || "tbd", resultText: "WON", isWinner: true, status: "PLAYED", name: participants[6]?.name || "TBD" },
          { id: participants[7]?.id || "tbd", resultText: "LOST", isWinner: false, status: "PLAYED", name: participants[7]?.name || "TBD" },
        ],
      },
      // Round 2
      {
        id: 5,
        name: "Semi Final - Match 1",
        nextMatchId: 7,
        tournamentRoundText: "2",
        startTime: "",
        state: "DONE",
        participants: [
          { id: participants[0]?.id || "tbd", resultText: "WON", isWinner: true, status: "PLAYED", name: participants[0]?.name || "TBD" },
          { id: participants[2]?.id || "tbd", resultText: "LOST", isWinner: false, status: "PLAYED", name: participants[2]?.name || "TBD" },
        ],
      },
      {
        id: 6,
        name: "Semi Final - Match 2",
        nextMatchId: 7,
        tournamentRoundText: "2",
        startTime: "",
        state: "DONE",
        participants: [
          { id: participants[4]?.id || "tbd", resultText: "WON", isWinner: true, status: "PLAYED", name: participants[4]?.name || "TBD" },
          { id: participants[6]?.id || "tbd", resultText: "LOST", isWinner: false, status: "PLAYED", name: participants[6]?.name || "TBD" },
        ],
      },
      // Final
      {
        id: 7,
        name: "Final - Match",
        nextMatchId: null,
        tournamentRoundText: "3",
        startTime: "",
        state: "DONE",
        participants: [
          { id: participants[0]?.id || "tbd", resultText: "WON", isWinner: true, status: "PLAYED", name: participants[0]?.name || "TBD" },
          { id: participants[4]?.id || "tbd", resultText: "LOST", isWinner: false, status: "PLAYED", name: participants[4]?.name || "TBD" },
        ],
      },
    ];

    return matchData;
  }, [books]);

  return (
    <div className="flex flex-col w-full h-screen">
      <div className="flex justify-center mb-4">
        <UsButton variant="red" onClick={() => {router.push("./")}}>
          Back
        </UsButton>
        <h1 className="text-4xl mx-4">Tournament Bracket</h1>
        <UsButton variant="blue" onClick={() => {router.push("./tournamentbracket/onevsone")}}>
          Enter stage
        </UsButton>
      </div>
      <div className="flex-1">
        <SingleEliminationBracket
          matches={matches}
          matchComponent={Match}
          svgWrapper={({ children, ...props }) => (
            <SVGViewer width={800} height={600} {...props}>
              {children}
            </SVGViewer>
          )}
        />
      </div>
    </div>
  );
};

export default TournamentBracketPage;