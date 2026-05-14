"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { JSX } from "react";

// ----------------------------
// CONSTANTS
// ----------------------------
const MW = 180;
const MH = 56;
const RG = 70;
const VG = 20;
const RL = 36;
const FG = 50;

// ----------------------------
// TYPES
// ----------------------------
interface BracketMatch {
  id: number | string;

  // Used for navigation to OneVsOne
  bmatchId: string;

  roundNumber: number;

  nameA: string;
  nameB: string;

  votesA: number;
  votesB: number;

  status: string;

  nextMatchId: number | string | null;

  side: "left" | "right" | "final";

  indexInRound: number;

  tournamentSubAId: string;
  tournamentSubBId: string;
}

// ----------------------------
// FETCH BRACKET
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

  const subIds = new Set<string>();

  matches.forEach((m: any) => {
    if (m.bmatch_submission_a) subIds.add(String(m.bmatch_submission_a));
    if (m.bmatch_submission_b) subIds.add(String(m.bmatch_submission_b));
  });

  if (subIds.size === 0) return matches;

  const { data: subs } = await supabase
    .from("tournament_submission")
    .select(`
      tournamentsub_id,
      concept (
        concept_id,
        concept_title
      )
    `)
    .in("tournamentsub_id", Array.from(subIds))
    .eq("tournamentsub_status", "approved");

  const subMap: Record<string, any> = {};

  subs?.forEach((s: any) => {
    subMap[String(s.tournamentsub_id)] = s.concept;
  });

  return matches.map((m: any) => ({
    ...m,
    concept_a: subMap[String(m.bmatch_submission_a)] ?? null,
    concept_b: subMap[String(m.bmatch_submission_b)] ?? null,
  }));
}

// ----------------------------
// BUILD FROM BRACKET (NO FALLBACK)
// ----------------------------
function buildFromBracket(raw: any[]): BracketMatch[] {
  const sorted = [...raw].sort((a, b) =>
    a.bmatch_round_number !== b.bmatch_round_number
      ? a.bmatch_round_number - b.bmatch_round_number
      : a.bmatch_id - b.bmatch_id
  );

  const rounds = [...new Set(sorted.map((m) => m.bmatch_round_number))].sort((a, b) => a - b);
  const finalRound = rounds[rounds.length - 1];

  const sideMap = new Map<number | string, "left" | "right" | "final">();

  const r1 = sorted.filter((m) => m.bmatch_round_number === rounds[0]);
  const half = Math.ceil(r1.length / 2);

  // assign round 1 sides
  r1.forEach((m, i) => {
    sideMap.set(m.bmatch_id, i < half ? "left" : "right");
  });

  // propagate sides
  rounds.forEach((round, rIdx) => {
    if (round === finalRound) return;

    const current = sorted.filter((m) => m.bmatch_round_number === round);
    const next = sorted.filter((m) => m.bmatch_round_number === rounds[rIdx + 1]);

    current.forEach((match, idx) => {
      const nextMatch = next[Math.floor(idx / 2)];
      if (!nextMatch) return;

      const currentSide = sideMap.get(match.bmatch_id) ?? "left";
      if (!sideMap.has(nextMatch.bmatch_id)) {
        sideMap.set(nextMatch.bmatch_id, currentSide);
      }
    });
  });

  return sorted.map((match) => {
    const roundIdx = rounds.indexOf(match.bmatch_round_number);

    const currentRoundMatches = sorted.filter(
      (m) => m.bmatch_round_number === match.bmatch_round_number
    );

    const idxInRound = currentRoundMatches.findIndex(
      (m) => m.bmatch_id === match.bmatch_id
    );

    const nextRoundMatches = sorted.filter(
      (m) => m.bmatch_round_number === rounds[roundIdx + 1]
    );

    const nextMatch =
      nextRoundMatches[Math.floor(idxInRound / 2)] ?? null;

    const side =
      match.bmatch_round_number === finalRound
        ? "final"
        : sideMap.get(match.bmatch_id) ?? "left";

    return {
      id: match.bmatch_id,
      bmatchId: String(match.bmatch_id),
      roundNumber: match.bmatch_round_number,
      nameA: match.concept_a?.concept_title ?? "TBD",
      nameB: match.concept_b?.concept_title ?? "TBD",
      votesA: match.bmatch_concept_a_votes ?? 0,
      votesB: match.bmatch_concept_b_votes ?? 0,
      status: match.bmatch_status ?? "scheduled",
      nextMatchId: nextMatch?.bmatch_id ?? null,
      side,
      indexInRound: idxInRound,
      tournamentSubAId: String(match.bmatch_submission_a ?? ""),
      tournamentSubBId: String(match.bmatch_submission_b ?? ""),
    };
  });
}

// ----------------------------
// HELPERS
// ----------------------------
function trunc(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

// ----------------------------
// SVG BRACKET
// ----------------------------
function BracketSVG({
  matches,
  onMatchClick,
}: {
  matches: BracketMatch[];
  onMatchClick: (m: BracketMatch) => void;
}) {
  if (!matches.length) return null;

  const rounds = [...new Set(matches.map((m) => m.roundNumber))].sort((a, b) => a - b);
  const finalRound = rounds[rounds.length - 1];
  const nonFinal = rounds.filter((r) => r !== finalRound);

  const leftR1 = matches.filter(
    (m) => m.roundNumber === rounds[0] && m.side === "left"
  );

  const rightR1 = matches.filter(
    (m) => m.roundNumber === rounds[0] && m.side === "right"
  );

  const sideWidth = nonFinal.length * (MW + RG);
  const finalX = sideWidth + FG;
  const totalW = finalX * 2 + MW;
  const totalH =
    RL +
    Math.max(leftR1.length, rightR1.length, 1) * (MH + VG) +
    120;

  const pos: Record<string | number, { x: number; y: number }> = {};

  nonFinal.forEach((round, rIdx) => {
    const leftMs = matches.filter(
      (m) => m.roundNumber === round && m.side === "left"
    );

    const rightMs = matches.filter(
      (m) => m.roundNumber === round && m.side === "right"
    );

    const lSpacing =
      ((totalH - RL) / Math.max(leftR1.length, 1)) * Math.pow(2, rIdx);

    const rSpacing =
      ((totalH - RL) / Math.max(rightR1.length, 1)) * Math.pow(2, rIdx);

    const lX = rIdx * (MW + RG);
    const rX = totalW - MW - rIdx * (MW + RG);

    leftMs.forEach((m, i) => {
      pos[m.id] = {
        x: lX,
        y: RL + i * lSpacing + lSpacing / 2 - MH / 2,
      };
    });

    rightMs.forEach((m, i) => {
      pos[m.id] = {
        x: rX,
        y: RL + i * rSpacing + rSpacing / 2 - MH / 2,
      };
    });
  });

  const finalMatch = matches.find((m) => m.side === "final");

  if (finalMatch) {
    pos[finalMatch.id] = {
      x: finalX,
      y: totalH / 2 - MH / 2,
    };
  }

  const cards: JSX.Element[] = [];

  matches.forEach((m) => {
    const p = pos[m.id];
    if (!p) return;

    const done = m.status === "done";
    const aWins = done && m.votesA > m.votesB;
    const bWins = done && m.votesB > m.votesA;

    cards.push(
      <g
        key={`m-${m.id}`}
        onClick={() => onMatchClick(m)}
        style={{ cursor: "pointer" }}
      >
        <rect
          x={p.x}
          y={p.y}
          width={MW}
          height={MH}
          rx={6}
          fill="#fff"
          stroke="#e0e0e0"
          strokeWidth={1}
        />

        <line
          x1={p.x}
          y1={p.y + MH / 2}
          x2={p.x + MW}
          y2={p.y + MH / 2}
          stroke="#e0e0e0"
        />

        <text x={p.x + 10} y={p.y + 18} fontSize={11}>
          {trunc(m.nameA, 20)}
        </text>

        <text x={p.x + 10} y={p.y + 42} fontSize={11}>
          {trunc(m.nameB, 20)}
        </text>

        <rect
          x={p.x}
          y={p.y}
          width={MW}
          height={MH}
          fill="transparent"
        />
      </g>
    );
  });

  return (
    <svg width={totalW} height={totalH}>
      {cards}
    </svg>
  );
}

// ----------------------------
// PAGE
// ----------------------------
export default function BracketPage({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);

      const bracket = await fetchBracket(tournamentId);

      if (!bracket) {
        setLoading(false);
        return;
      }

      const raw = await fetchBracketMatches(bracket.bracket_id);

      if (!raw.length) {
        setLoading(false);
        return;
      }

      setMatches(buildFromBracket(raw));
      setLoading(false);
    }

    load();
  }, [tournamentId]);

  const handleMatchClick = (m: BracketMatch) => {
    if (!m.bmatchId) return;

    router.push(`./onevsone?bmatch=${m.bmatchId}`);
  };

  if (loading) return <div>Loading bracket...</div>;
  if (!matches.length) return <div>No bracket to display right now.</div>;

  return (
    <div style={{ padding: 24, background: "#f9f9f9", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Tournament Bracket</h1>

      <div style={{ background: "#fff", padding: 24 }}>
        <BracketSVG matches={matches} onMatchClick={handleMatchClick} />
      </div>
    </div>
  );
}