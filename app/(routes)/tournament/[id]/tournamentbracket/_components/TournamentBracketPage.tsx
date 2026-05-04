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
    .eq("tournament_id", tournamentId)
    .order("tournamentsub_likes", { ascending: false }); // highest likes = seed 1

  if (error || !data) return [];
  console.log("Submissions fetched:", JSON.stringify(data, null, 2));
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

  // Pad with nulls (byes) if submissions aren't a power of 2
  const padded = [...submissions];
  while (padded.length < size) padded.push(null);

  // Pre-generate all match IDs per round so we can link nextMatchId
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

      // Only assign real teams in round 1, later rounds are TBD
      const teamA = r === 0 ? padded[i * 2] : null;
      const teamB = r === 0 ? padded[i * 2 + 1] : null;

      // Seed numbers based on position after sorting by likes
      const seedA = i * 2 + 1;
      const seedB = i * 2 + 2;

      matches.push({
        id,
        name: `Round ${r + 1} - Match ${i + 1}`,
        nextMatchId: nextMatchId ?? null,
        tournamentRoundText: `${r + 1}`,
        startTime: new Date().toISOString(),
        state: "SCHEDULED",
        participants: [
          teamA
            ? {
                id: String(teamA.tournamentsub_id),
                name: teamA.concept?.concept_title || `Submission ${seedA}`,
                seed: seedA,
                isWinner: false,
                status: null,
                resultText: null,
              }
            : {
                id: `bye-${id}-a`,
                name: "TBD",
                seed: null,
                isWinner: false,
                status: "NO_PARTY",
                resultText: null,
              },
          teamB
            ? {
                id: String(teamB.tournamentsub_id),
                name: teamB.concept?.concept_title || `Submission ${seedB}`,
                seed: seedB,
                isWinner: false,
                status: null,
                resultText: null,
              }
            : {
                id: `bye-${id}-b`,
                name: "TBD",
                seed: null,
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


// custom match box as react-tournament-brackets one is broken
const CustomMatch = ({
  match,
  onMouseEnter,
  onMouseLeave,
  topParty,
  bottomParty,
}: any) => {
  const router = useRouter();

  const handleMatchClick = () => {
    if (!topParty?.id || !bottomParty?.id) return;
    console.log("Navigating with:", topParty.id, bottomParty.id);
    router.push(`./onevsone?conceptA=${topParty.id}&conceptB=${bottomParty.id}`);
  };

  return (
    <div
      onClick={handleMatchClick}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        cursor: "pointer",
        fontFamily: "sans-serif",
      }}
    >
      {/* Match label */}
      <div style={{
        fontSize: "10px",
        color: "#999",
        marginBottom: "4px",
        paddingLeft: "2px",
      }}>
        {match?.name || "Match"}
      </div>

      {/* Match card */}
      <div style={{
        border: "1px solid #e0e0e0",
        borderRadius: "6px",
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}>
        {/* Top participant */}
        <div
          onMouseEnter={() => onMouseEnter && onMouseEnter(topParty?.id)}
          onMouseLeave={() => onMouseLeave && onMouseLeave()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "2px 10px",
            borderBottom: "1px solid #e0e0e0",
            background: topParty?.isWinner ? "#f0fff4" : "#fff",
            flex: 1, // ADD THIS
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {topParty?.seed && (
              <span style={{ color: "#999", fontSize: "10px", minWidth: "16px" }}>
                #{topParty.seed}
              </span>
            )}
            <span style={{
              fontSize: "12px",
              fontWeight: topParty?.isWinner ? 700 : 400,
              color: topParty?.status === "NO_PARTY" ? "#bbb" : "#1a1a1a",
            }}>
              {topParty?.name || "TBD"}
            </span>
          </div>
          {topParty?.resultText != null && (
            <span style={{
              fontSize: "12px",
              fontWeight: 700,
              color: topParty?.isWinner ? "#22c55e" : "#ef4444",
              marginLeft: "8px",
            }}>
              {topParty.resultText}
            </span>
          )}
        </div>

        {/* Bottom participant */}
        <div
          onMouseEnter={() => onMouseEnter && onMouseEnter(bottomParty?.id)}
          onMouseLeave={() => onMouseLeave && onMouseLeave()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "2px 10px",
            background: bottomParty?.isWinner ? "#f0fff4" : "#fff",
            flex: 1, // ADD THIS
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {bottomParty?.seed && (
              <span style={{ color: "#999", fontSize: "10px", minWidth: "16px" }}>
                #{bottomParty.seed}
              </span>
            )}
            <span style={{
              fontSize: "12px",
              fontWeight: bottomParty?.isWinner ? 700 : 400,
              color: bottomParty?.status === "NO_PARTY" ? "#bbb" : "#1a1a1a",
            }}>
              {bottomParty?.name || "TBD"}
            </span>
          </div>
          {bottomParty?.resultText != null && (
            <span style={{
              fontSize: "12px",
              fontWeight: 700,
              color: bottomParty?.isWinner ? "#22c55e" : "#ef4444",
              marginLeft: "8px",
            }}>
              {bottomParty.resultText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

  if (loading) return <div>Loading bracket...</div>;
  if (!matches.length) return <div>No submissions found for this tournament.</div>;

  const totalRounds = Math.ceil(Math.log2(matches.length + 1));
  const bracketWidth = Math.max(800, totalRounds * 250);
  const bracketHeight = Math.max(400, (matches.length + 1) * 80);

  return (
    <div style={{ padding: "24px", background: "#f9f9f9", minHeight: "100vh" }}>
      <h1 style={{
        fontSize: "28px",
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: "8px",
      }}>
        Tournament Bracket
      </h1>
      {usingFallback && (
        <p style={{
          color: "#999",
          fontSize: "13px",
          marginBottom: "16px",
        }}>
          No bracket created yet — showing preview based on current submissions.
        </p>
      )}
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        overflowX: "auto",
      }}>
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
    </div>
  );
}