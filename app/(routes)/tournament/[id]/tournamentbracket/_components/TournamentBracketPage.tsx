"use client";

import { useEffect, useState, } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  SingleEliminationBracket,
  Match,
  SVGViewer,
} from "@elyasasmad/react-tournament-brackets";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ----------------------------
// FETCH BRACKET IF IT EXISTS
// ----------------------------
async function fetchBracket(tournamentId: string) {
  const { data, error } = await supabase
    .from("bracket")
    .select("*")
    .eq("tournament_id", tournamentId)
    .single();

  if (error || !data) return null;
  return data;
}

// ----------------------------
// FETCH BRACKET MATCHES
// ----------------------------
async function fetchBracketMatches(bracketId: string) {
  const { data, error } = await supabase
    .from("bracket_match")
    .select("*")
    .eq("bracket_id", bracketId);

  if (error || !data) return [];
  return data;
}

// ----------------------------
// FETCH SUBMISSIONS (fallback)
// ----------------------------
async function fetchSubmissions(tournamentId: string) {
  const { data, error } = await supabase
    .from("tournament_submission")
    .select("*, concept(*)")
    .eq("tournament_id", tournamentId);

  if (error || !data) return [];

  console.log("Submissions fetched:", JSON.stringify(data, null, 2)); // ADD THIS
  return data;
}

// ----------------------------
// BUILD FROM BRACKET MATCHES
// ----------------------------
function buildMatchesFromBracket(bracketMatches: any[]) {
  // Sort by match ID so rounds are in order
  const sorted = [...bracketMatches].sort((a, b) => a.bmatch_id - b.bmatch_id);

  return sorted.map((match, i) => {
    const nextMatch = sorted.find(
      (m) =>
        m.bmatch_id !==  match.bmatch_id &&
        sorted.indexOf(m) === Math.floor(sorted.indexOf(match) / 2) + sorted.length / 2
    );

    return {
      id: match.bmatch_id,
      name: `Match ${match.bmatch_id}`,
      nextMatchId: nextMatch?.bmatch_id ?? null,
      tournamentRoundText: `Round ${match.bracket_round_number ?? 1}`,
      startTime: new Date().toISOString(),
      state: match.bmatch_status === "done" ? "DONE" : "SCHEDULED",
      participants: [
        {
          id: String(match.bmatch_concept_a ?? `tbd-a-${i}`),
          name: match.bmatch_concept_a ? `Concept ${match.bmatch_concept_a}` : "TBD",
          isWinner: match.bmatch_concept_a_votes > match.bmatch_concept_b_votes,
          status: match.bmatch_status === "done" ? "PLAYED" : null,
          resultText: match.bmatch_concept_a_votes ?? null,
        },
        {
          id: String(match.bmatch_concept_b ?? `tbd-b-${i}`),
          name: match.bmatch_concept_b ? `Concept ${match.bmatch_concept_b}` : "TBD",
          isWinner: match.bmatch_concept_b_votes > match.bmatch_concept_a_votes,
          status: match.bmatch_status === "done" ? "PLAYED" : null,
          resultText: match.bmatch_concept_b_votes ?? null,
        },
      ],
    };
  });
}

// ----------------------------
// BUILD FROM SUBMISSIONS (fallback)
// ----------------------------
function buildMatchesFromSubmissions(submissions: any[]) {
  const size = Math.pow(2, Math.ceil(Math.log2(submissions.length)));
  const totalRounds = Math.log2(size);

  const padded = [...submissions];
  while (padded.length < size) padded.push(null);

  let matchId = 1;
  const roundMatchIds: number[][] = [];
  let matchesInRound = size / 2;
  for (let r = 0; r < totalRounds; r++) {
    const ids = Array.from({ length: matchesInRound }, (_, i) => matchId + i);
    roundMatchIds.push(ids);
    matchId += matchesInRound;
    matchesInRound = Math.floor(matchesInRound / 2);
  }

  const matches: any[] = [];

  for (let r = 0; r < totalRounds; r++) {
    const ids = roundMatchIds[r];
    const nextRoundIds = roundMatchIds[r + 1] || [];

    ids.forEach((id, i) => {
      const nextMatchId = nextRoundIds[Math.floor(i / 2)] ?? null;
      const teamA = r === 0 ? padded[i * 2] : null;
      const teamB = r === 0 ? padded[i * 2 + 1] : null;

      matches.push({
        id,
        name: `Round ${r + 1} - Match ${i + 1}`,
        nextMatchId: nextMatchId ?? null,
        tournamentRoundText: `Round ${r + 1}`,
        startTime: new Date().toISOString(),
        state: "SCHEDULED",
        participants: [
          teamA
            ? {
                id: String(teamA.tournamentsub_id),
                name: teamA.concept?.concept_title || `Submission ${i * 2 + 1}`,
                isWinner: false,
                status: null,
                resultText: null,
              }
            : {
                id: `bye-${id}-a`,
                name: "TBD",
                isWinner: false,
                status: "NO_PARTY",
                resultText: null,
              },
          teamB
            ? {
                id: String(teamB.tournamentsub_id),
                name: teamB.concept?.concept_title || `Submission ${i * 2 + 2}`,
                isWinner: false,
                status: null,
                resultText: null,
              }
            : {
                id: `bye-${id}-b`,
                name: "TBD",
                isWinner: false,
                status: "NO_PARTY",
                resultText: null,
              },
        ],
      });
    });
  }

  return matches;
}

// ----------------------------
// PAGE
// ----------------------------
export default function BracketPage({ tournamentId }: { tournamentId: string }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Step 1: Check if a bracket exists for this tournament
      const bracket = await fetchBracket(tournamentId);

      if (bracket) {
        // Step 2: Bracket exists — load matches from bracket_match table
        const bracketMatches = await fetchBracketMatches(bracket.bracket_id);
        setMatches(buildMatchesFromBracket(bracketMatches));
        setUsingFallback(false);
      } else {
        // Step 3: No bracket yet — fall back to tournament submissions
        const submissions = await fetchSubmissions(tournamentId);
        setMatches(buildMatchesFromSubmissions(submissions));
        setUsingFallback(true);
      }

      setLoading(false);
    }

    load();
  }, [tournamentId]);

const CustomMatch = ({
  match,
  onMatchClick,
  onPartyClick,
  onMouseEnter,
  onMouseLeave,
  topParty,
  bottomParty,
}: any) => {
  const router = useRouter();

  const handleMatchClick = () => {
    if (!topParty?.id || !bottomParty?.id) return;
    router.push(`./onevsone?conceptA=${topParty.id}&conceptB=${bottomParty.id}`);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        width: "100%",
        height: "100%",
        padding: "4px",
        boxSizing: "border-box",
        border: "1px solid #333",
        borderRadius: "4px",
        background: "#1a1a2e",
        color: "#fff",
        fontSize: "12px",
        cursor: "pointer",
      }}
      onClick={handleMatchClick}
    >
      <div
        onMouseEnter={() => onMouseEnter && onMouseEnter(topParty?.id)}
        onMouseLeave={() => onMouseLeave && onMouseLeave()}
        style={{
          padding: "4px",
          borderBottom: "1px solid #333",
          background: topParty?.isWinner ? "#2d5a27" : "transparent",
        }}
      >
        {topParty?.name || "TBD"}
      </div>
      <div
        onMouseEnter={() => onMouseEnter && onMouseEnter(bottomParty?.id)}
        onMouseLeave={() => onMouseLeave && onMouseLeave()}
        style={{
          padding: "4px",
          background: bottomParty?.isWinner ? "#2d5a27" : "transparent",
        }}
      >
        {bottomParty?.name || "TBD"}
      </div>
    </div>
  );
};

  if (loading) return <div>Loading bracket...</div>;
  if (!matches.length) return <div>No submissions found for this tournament.</div>;

  // Calculate dimensions based on bracket size
  const totalRounds = Math.ceil(Math.log2(matches.length + 1));
  const bracketWidth = Math.max(800, totalRounds * 250);
  const bracketHeight = Math.max(400, (matches.length + 1) * 80);

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <h1>Tournament Bracket</h1>
      {usingFallback && (
        <p style={{ color: "gray", fontSize: "0.85rem" }}>
          No bracket created yet — showing preview based on current submissions.
        </p>
      )}
      <SingleEliminationBracket
        matches={matches}
        matchComponent={CustomMatch}
        svgWrapper={({ children, bracketWidth: bw, bracketHeight: bh, startAt, ...props }) => (
          <svg
            {...props}
            width={bracketWidth}
            height={bracketHeight}
            style={{ display: "block" }}
          >
            {children}
          </svg>
        )}
      />
    </div>
  );
}