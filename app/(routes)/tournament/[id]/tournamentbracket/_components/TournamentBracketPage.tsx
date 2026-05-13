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
  const { data, error } = await supabase
    .from("bracket_match")
    .select("*")
    .eq("bracket_id", bracketId);

  if (error || !data) return [];
  return data;
}

// ----------------------------
// BUILD FROM BRACKET MATCHES
// ----------------------------
function buildMatchesFromBracket(bracketMatches: any[]) {
  const sorted = [...bracketMatches].sort((a, b) => a.bmatch_id - b.bmatch_id);

  return sorted.map((match, i) => {
    const nextMatch = sorted.find(
      (m) =>
        m.bmatch_id !== match.bmatch_id &&
        sorted.indexOf(m) === Math.floor(sorted.indexOf(match) / 2) + sorted.length / 2
    );

    return {
      id: match.bmatch_id,
      name: `Match ${match.bmatch_id}`,
      nextMatchId: nextMatch?.bmatch_id ?? null,
      tournamentRoundText: `${match.bracket_round_number ?? 1}`,
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
// PAGE
// ----------------------------
export default function BracketPage({ tournamentId }: { tournamentId: string }) {
  const [matches, setMatches] = useState<any[]>([]);
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

      setMatches(buildMatchesFromBracket(bracketMatches));
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
              flex: 1,
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
              flex: 1,
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
  if (!matches.length) return <div>No bracket to be displayed right now.</div>;

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