"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  SingleEliminationBracket,
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
  const { data: matches, error } = await supabase
    .from("bracket_match")
    .select("*")
    .eq("bracket_id", bracketId);

  if (error || !matches) return [];

  const conceptIds = new Set<string>();
  matches.forEach((match: any) => {
    if (match.bmatch_concept_a) conceptIds.add(String(match.bmatch_concept_a));
    if (match.bmatch_concept_b) conceptIds.add(String(match.bmatch_concept_b));
  });

  if (conceptIds.size === 0) return matches;

  const { data: concepts, error: conceptError } = await supabase
    .from("concept")
    .select("concept_id, concept_title, concept_description")
    .in("concept_id", Array.from(conceptIds));

  if (conceptError) {
    console.warn("Supabase fetchBracketMatches concept fetch error:", conceptError);
    return matches;
  }

  const conceptMap: Record<string, any> = {};
  concepts?.forEach((concept: any) => {
    conceptMap[String(concept.concept_id)] = concept;
  });

  return matches.map((match: any) => ({
    ...match,
    concept_a: conceptMap[String(match.bmatch_concept_a)] ?? null,
    concept_b: conceptMap[String(match.bmatch_concept_b)] ?? null,
  }));
}

// ----------------------------
// BUILD FROM BRACKET MATCHES
// ----------------------------
function buildMatchesFromBracket(bracketMatches: any[]): {
  matches: any[];
  bottomHalfIds: Set<number>;
} {
  const sorted = [...bracketMatches].sort((a, b) =>
    a.bmatch_round_number !== b.bmatch_round_number
      ? a.bmatch_round_number - b.bmatch_round_number
      : a.bmatch_id - b.bmatch_id
  );

  const rounds = [...new Set(sorted.map((m) => m.bmatch_round_number))].sort(
    (a, b) => a - b
  );
  const totalRounds = rounds.length;
  const finalRound = rounds[totalRounds - 1];

  // Split round 1 matches into top and bottom halves
  const round1Matches = sorted.filter((m) => m.bmatch_round_number === rounds[0]);
  const half = Math.ceil(round1Matches.length / 2);
  const topHalfFirstRoundIds = new Set(
    round1Matches.slice(0, half).map((m) => m.bmatch_id)
  );

  const topHalfIds = new Set<number>();
  const bottomHalfIds = new Set<number>();

  // Assign round 1 matches to halves
  sorted.forEach((match) => {
    if (match.bmatch_round_number === finalRound) return;
    if (topHalfFirstRoundIds.has(match.bmatch_id)) {
      topHalfIds.add(match.bmatch_id);
    } else if (match.bmatch_round_number === rounds[0]) {
      bottomHalfIds.add(match.bmatch_id);
    }
  });

  // Propagate half membership through subsequent rounds
  rounds.slice(1, -1).forEach((round) => {
    const roundMatches = sorted.filter((m) => m.bmatch_round_number === round);
    roundMatches.forEach((match, i) => {
      if (i < Math.ceil(roundMatches.length / 2)) {
        topHalfIds.add(match.bmatch_id);
      } else {
        bottomHalfIds.add(match.bmatch_id);
      }
    });
  });

  const matches = sorted.map((match) => {
    const currentRoundIndex = rounds.indexOf(match.bmatch_round_number);
    const nextRound = rounds[currentRoundIndex + 1];

    const nextRoundMatches = sorted.filter(
      (m) => m.bmatch_round_number === nextRound
    );
    const matchIndexInRound = sorted
      .filter((m) => m.bmatch_round_number === match.bmatch_round_number)
      .indexOf(match);
    const nextMatch = nextRoundMatches[Math.floor(matchIndexInRound / 2)] ?? null;

    return {
      id: match.bmatch_id,
      name: `Match ${match.bmatch_id}`,
      nextMatchId: nextMatch?.bmatch_id ?? null,
      tournamentRoundText: `${match.bmatch_round_number}`,
      startTime: new Date().toISOString(),
      state: match.bmatch_status === "done" ? "DONE" : "SCHEDULED",
      participants: [
        {
          id: String(match.bmatch_concept_a ?? `tbd-a-${match.bmatch_id}`),
          name: match.concept_a?.concept_title ?? "TBD",
          description: match.concept_a?.concept_description ?? "",
          isWinner:
            match.bmatch_concept_a_votes > match.bmatch_concept_b_votes,
          status: match.bmatch_status === "done" ? "PLAYED" : null,
          resultText: match.bmatch_concept_a_votes ?? null,
        },
        {
          id: String(match.bmatch_concept_b ?? `tbd-b-${match.bmatch_id}`),
          name: match.concept_b?.concept_title ?? "TBD",
          description: match.concept_b?.concept_description ?? "",
          isWinner:
            match.bmatch_concept_b_votes > match.bmatch_concept_a_votes,
          status: match.bmatch_status === "done" ? "PLAYED" : null,
          resultText: match.bmatch_concept_b_votes ?? null,
        },
      ],
    };
  });

  return { matches, bottomHalfIds };
}

// ----------------------------
// PAGE
// ----------------------------
export default function BracketPage({ tournamentId }: { tournamentId: string }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [bottomHalfIds, setBottomHalfIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const bracket = await fetchBracket(tournamentId);

      if (!bracket) {
        setMatches([]);
        setLoading(false);
        return;
      }

      const bracketMatches = await fetchBracketMatches(bracket.bracket_id);

      if (!bracketMatches.length) {
        setMatches([]);
        setLoading(false);
        return;
      }

      const { matches: built, bottomHalfIds: halfIds } =
        buildMatchesFromBracket(bracketMatches);
      setMatches(built);
      setBottomHalfIds(halfIds);
      setLoading(false);
    }

    load();
  }, [tournamentId]);

  // ----------------------------
  // CUSTOM MATCH COMPONENT
  // ----------------------------
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
      router.push(
        `./onevsone?conceptA=${topParty.id}&conceptB=${bottomParty.id}`
      );
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
        <div
          style={{
            fontSize: "10px",
            color: "#999",
            marginBottom: "4px",
            paddingLeft: "2px",
          }}
        >
          {match?.name || "Match"}
        </div>

        {/* Match card */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "6px",
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
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
              flex: 1,
              boxSizing: "border-box",
            }}
          >
            <div
            title={
              topParty?.description
                ? `${topParty.name}\n\n${topParty.description}`
                : topParty?.name
            }
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
              {topParty?.seed && (
                <span
                  style={{
                    color: "#999",
                    fontSize: "10px",
                    minWidth: "16px",
                  }}
                >
                  #{topParty.seed}
                </span>
              )}
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: topParty?.isWinner ? 700 : 400,
                  color:
                    topParty?.status === "NO_PARTY" ? "#bbb" : "#1a1a1a",
                }}
              >
                {topParty?.name || "TBD"}
              </span>
            </div>
            {topParty?.resultText != null && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: topParty?.isWinner ? "#22c55e" : "#ef4444",
                  marginLeft: "8px",
                }}
              >
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
              flex: 1,
              boxSizing: "border-box",
            }}
          >
            <div
            title={
              bottomParty?.description
                ? `${bottomParty.name}\n\n${bottomParty.description}`
                : bottomParty?.name
            }
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
              {bottomParty?.seed && (
                <span
                  style={{
                    color: "#999",
                    fontSize: "10px",
                    minWidth: "16px",
                  }}
                >
                  #{bottomParty.seed}
                </span>
              )}
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: bottomParty?.isWinner ? 700 : 400,
                  color:
                    bottomParty?.status === "NO_PARTY" ? "#bbb" : "#1a1a1a",
                }}
              >
                {bottomParty?.name || "TBD"}
              </span>
            </div>
            {bottomParty?.resultText != null && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: bottomParty?.isWinner ? "#22c55e" : "#ef4444",
                  marginLeft: "8px",
                }}
              >
                {bottomParty.resultText}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading bracket...</div>;
  if (!matches.length) return <div>No bracket to be displayed right now.</div>;

  const totalRounds = Math.ceil(Math.log2(matches.length + 1));
  const bracketWidth = Math.max(800, totalRounds * 250);
  const bracketHeight = Math.max(400, (matches.length + 1) * 80);

  const topHalfMatches = matches.filter(
    (m) => !bottomHalfIds.has(m.id)
  );
  const bottomHalfMatches = matches.filter((m) => bottomHalfIds.has(m.id));
  const finalMatch = matches.filter(
    (m) => !bottomHalfIds.has(m.id) && m.nextMatchId === null && topHalfMatches.length > 1
  );
  const topMatches = topHalfMatches.filter(
    (m) => !finalMatch.find((f) => f.id === m.id)
  );

  return (
    <div style={{ padding: "24px", background: "#f9f9f9", minHeight: "100vh" }}>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "700",
          color: "#1a1a1a",
          marginBottom: "8px",
        }}
      >
        Tournament Bracket
      </h1>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Left side — top half */}
          <SingleEliminationBracket
            matches={topMatches.length > 0 ? topMatches : matches}
            matchComponent={CustomMatch}
            svgWrapper={({
              children,
              bracketWidth: bw,
              bracketHeight: bh,
              startAt,
              ...props
            }) => (
              <svg
                {...props}
                width={bracketWidth / 2}
                height={bracketHeight}
                style={{ display: "block" }}
              >
                {children}
              </svg>
            )}
          />

          {/* Final match in the centre */}
          {finalMatch.length > 0 && (
            <SingleEliminationBracket
              matches={finalMatch}
              matchComponent={CustomMatch}
              svgWrapper={({
                children,
                bracketWidth: bw,
                bracketHeight: bh,
                startAt,
                ...props
              }) => (
                <svg
                  {...props}
                  width={200}
                  height={bracketHeight}
                  style={{ display: "block" }}
                >
                  {children}
                </svg>
              )}
            />
          )}

          {/* Right side — bottom half, mirrored */}
          {bottomHalfMatches.length > 0 && (
            <div style={{ transform: "scaleX(-1)" }}>
              <SingleEliminationBracket
                matches={bottomHalfMatches}
                matchComponent={CustomMatch}
                svgWrapper={({
                  children,
                  bracketWidth: bw,
                  bracketHeight: bh,
                  startAt,
                  ...props
                }) => (
                  <svg
                    {...props}
                    width={bracketWidth / 2}
                    height={bracketHeight}
                    style={{ display: "block" }}
                  >
                    {children}
                  </svg>
                )}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}